"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/env";
import { buildCartFingerprint, generateOrderNumberCandidate } from "@/lib/reliability";
import type { CartItem, OrderStatus, StaffRequestType, TableStatus } from "@/types";

const statusFlow: OrderStatus[] = ["new", "preparing", "ready", "completed"];
const duplicateWindowMs = 8_000;

type AvailableMenuItemRow = {
  id: string;
  name: string;
  price: string | number;
};

export async function createOrderAction({
  tableNumber,
  notes,
  cart
}: {
  tableNumber: string;
  notes: string;
  cart: CartItem[];
}) {
  if (!tableNumber.trim()) throw new Error("Table number is required.");
  if (cart.length === 0) throw new Error("Cart is empty.");

  const supabase = await createClient();
  const mutationClient = isServiceRoleConfigured() ? createAdminClient() : supabase;
  const cleanTableNumber = tableNumber.trim();
  const cleanNotes = notes.trim();
  const requestedCart = cart.filter((item) => item.quantity > 0);

  if (requestedCart.length === 0) throw new Error("Cart is empty.");

  const { data: settings, error: settingsError } = await supabase
    .from("restaurant_settings")
    .select("ordering_enabled")
    .limit(1)
    .single();

  if (settingsError) throw settingsError;
  if (!settings?.ordering_enabled) throw new Error("Ordering is currently closed.");

  const requestedIds = [...new Set(requestedCart.map((item) => item.menuItem.id))];
  const { data: menuRows, error: menuError } = await supabase
    .from("menu_items")
    .select("id, name, price")
    .in("id", requestedIds);

  if (menuError) throw menuError;
  if ((menuRows ?? []).length !== requestedIds.length) {
    throw new Error("One or more items are no longer available.");
  }

  const menuById = new Map(
    ((menuRows ?? []) as AvailableMenuItemRow[]).map((item) => [item.id, item])
  );

  const orderItems = requestedCart.map((item) => {
    const menuItem = menuById.get(item.menuItem.id);
    if (!menuItem) throw new Error("One or more items are no longer available.");

    const unitPrice = Number(menuItem.price);
    return {
      order_id: "",
      menu_item_id: menuItem.id,
      item_name: menuItem.name,
      unit_price: unitPrice,
      quantity: item.quantity,
      line_total: unitPrice * item.quantity
    };
  });

  const subtotal = orderItems.reduce((total, item) => total + item.line_total, 0);
  const cartFingerprint = buildCartFingerprint(
    orderItems.map((item) => ({
      id: item.menu_item_id,
      quantity: item.quantity,
      price: item.unit_price
    }))
  );
  const duplicate = await findRecentDuplicateOrder({
    tableNumber: cleanTableNumber,
    notes: cleanNotes,
    subtotal,
    cartFingerprint
  });

  if (duplicate) return duplicate;

  const order = await insertOrderWithRetry({
    tableNumber: cleanTableNumber,
    notes: cleanNotes,
    subtotal
  });

  const { error: itemsError } = await mutationClient.from("order_items").insert(
    orderItems.map((item) => ({ ...item, order_id: order.id }))
  );

  if (itemsError) {
    if (isServiceRoleConfigured()) {
      await createAdminClient().from("orders").delete().eq("id", order.id);
    }
    throw itemsError;
  }

  await mutationClient.from("tables").update({ status: "occupied" }).eq("table_number", cleanTableNumber);

  revalidatePath("/menu");
  revalidatePath("/kitchen");
  revalidatePath("/admin");

  return order.id as string;
}

export async function createStaffRequestAction({
  tableNumber,
  type
}: {
  tableNumber: string;
  type: StaffRequestType;
}) {
  if (!tableNumber.trim()) throw new Error("Table number is required.");

  const supabase = await createClient();
  const mutationClient = isServiceRoleConfigured() ? createAdminClient() : supabase;
  const cleanTableNumber = tableNumber.trim();
  const { data: existing, error: existingError } = await supabase
    .from("staff_requests")
    .select("id")
    .eq("table_number", cleanTableNumber)
    .eq("type", type)
    .eq("status", "open")
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing?.id) return existing.id as string;

  const { data, error } = await mutationClient
    .from("staff_requests")
    .insert({
      table_number: cleanTableNumber,
      type,
      status: "open"
    })
    .select("id")
    .single();

  if (error) throw error;

  if (type === "bill") {
    await mutationClient.from("tables").update({ status: "needs_bill" }).eq("table_number", cleanTableNumber);
  }

  revalidatePath("/kitchen");
  revalidatePath("/admin");

  return data.id as string;
}

export async function verifyKitchenPinAction(pin: string) {
  await assertKitchenPin(pin);
  return true;
}

async function insertOrderWithRetry({
  tableNumber,
  notes,
  subtotal
}: {
  tableNumber: string;
  notes: string;
  subtotal: number;
}) {
  const mutationClient = isServiceRoleConfigured() ? createAdminClient() : await createClient();
  const now = new Date();
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const entropy = (Number(String(Date.now()).slice(-3)) + Math.floor(Math.random() * 997)) % 1000;
    const { data, error } = await mutationClient
      .from("orders")
      .insert({
        order_number: generateOrderNumberCandidate(now, attempt, entropy),
        table_number: tableNumber,
        notes,
        subtotal,
        status: "new"
      })
      .select("id")
      .single();

    if (!error && data?.id) return data as { id: string };
    lastError = error;

    if (!isUniqueViolation(error)) break;
  }

  throw lastError ?? new Error("Could not create order.");
}

async function findRecentDuplicateOrder({
  tableNumber,
  notes,
  subtotal,
  cartFingerprint
}: {
  tableNumber: string;
  notes: string;
  subtotal: number;
  cartFingerprint: string;
}) {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - duplicateWindowMs).toISOString();
  const { data, error } = await supabase
    .from("orders")
    .select("id, notes, subtotal, order_items(menu_item_id, quantity, unit_price)")
    .eq("table_number", tableNumber)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) return null;

  const duplicate = (data ?? []).find((order) => {
    const orderSubtotal = Number(order.subtotal ?? 0);
    const orderNotes = String(order.notes ?? "").trim();
    const orderFingerprint = buildCartFingerprint(
      (order.order_items ?? []).map((item) => ({
        id: String(item.menu_item_id ?? ""),
        quantity: Number(item.quantity ?? 0),
        price: Number(item.unit_price ?? 0)
      }))
    );

    return orderSubtotal === subtotal && orderNotes === notes && orderFingerprint === cartFingerprint;
  });

  return duplicate?.id ? String(duplicate.id) : null;
}

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; message?: string };
  return maybeError.code === "23505" || /duplicate key/i.test(maybeError.message ?? "");
}

export async function updateOrderStatusAction({
  orderId,
  status,
  kitchenPin
}: {
  orderId: string;
  status: OrderStatus;
  kitchenPin?: string;
}) {
  if (kitchenPin) await assertKitchenPin(kitchenPin);
  const supabase = kitchenPin ? createAdminClient() : await createClient();

  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) throw error;

  revalidatePath("/kitchen");
  revalidatePath("/admin");
}

export async function advanceOrderStatusAction({
  orderId,
  currentStatus,
  kitchenPin
}: {
  orderId: string;
  currentStatus: OrderStatus;
  kitchenPin?: string;
}) {
  const nextStatus = statusFlow[Math.min(statusFlow.indexOf(currentStatus) + 1, statusFlow.length - 1)];
  await updateOrderStatusAction({ orderId, status: nextStatus, kitchenPin });
}

export async function resolveStaffRequestAction({
  requestId,
  kitchenPin
}: {
  requestId: string;
  kitchenPin?: string;
}) {
  if (kitchenPin) await assertKitchenPin(kitchenPin);
  const supabase = kitchenPin ? createAdminClient() : await createClient();
  const { error } = await supabase
    .from("staff_requests")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", requestId);

  if (error) throw error;

  revalidatePath("/kitchen");
  revalidatePath("/admin");
}

export async function updateTableStatusAction({
  tableId,
  status,
  kitchenPin
}: {
  tableId: string;
  status: TableStatus;
  kitchenPin?: string;
}) {
  if (kitchenPin) await assertKitchenPin(kitchenPin);
  const supabase = kitchenPin ? createAdminClient() : await requireAdminMutationClient();
  const { error } = await supabase.from("tables").update({ status }).eq("id", tableId);

  if (error) throw error;

  revalidatePath("/kitchen");
  revalidatePath("/admin");
}

async function requireAdminMutationClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/admin/login");

  const adminCheckClient = isServiceRoleConfigured() ? createAdminClient() : supabase;
  const { data, error } = await adminCheckClient
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) redirect("/admin/login");

  return adminCheckClient;
}

async function assertKitchenPin(pin: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("restaurant_settings")
    .select("kitchen_pin")
    .limit(1)
    .single();

  if (error) throw error;
  if (!data?.kitchen_pin || data.kitchen_pin !== pin) {
    throw new Error("Invalid kitchen PIN.");
  }
}
