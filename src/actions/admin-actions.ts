"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isServiceRoleConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AdminActionResult = {
  ok: boolean;
  error?: string;
};

async function requireAdmin() {
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

function adminActionError(error: unknown, fallback: string): AdminActionResult {
  if (error instanceof Error) return { ok: false, error: error.message };
  if (error && typeof error === "object" && "message" in error) {
    return { ok: false, error: String((error as { message?: unknown }).message ?? fallback) };
  }

  return { ok: false, error: fallback };
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function toggleOrderingAction(currentValue: boolean) {
  try {
    const supabase = await requireAdmin();
    const { data: settings, error: settingsError } = await supabase
      .from("restaurant_settings")
      .select("id")
      .limit(1)
      .single();

    if (settingsError) throw settingsError;
    if (!settings?.id) throw new Error("Restaurant settings row was not found.");

    const { error } = await supabase
      .from("restaurant_settings")
      .update({ ordering_enabled: !currentValue, updated_at: new Date().toISOString() })
      .eq("id", settings.id);

    if (error) throw error;
    revalidatePath("/admin");
    revalidatePath("/menu");
    return { ok: true };
  } catch (error) {
    return adminActionError(error, "Could not update ordering.");
  }
}

export async function toggleItemAvailabilityAction(itemId: string, currentValue: boolean) {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: !currentValue, updated_at: new Date().toISOString() })
      .eq("id", itemId);

    if (error) throw error;
    revalidatePath("/admin");
    revalidatePath("/menu");
    return { ok: true };
  } catch (error) {
    return adminActionError(error, "Could not update menu availability.");
  }
}

export async function createCategoryAction(input: {
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
}) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("menu_categories").insert({
    name: input.name,
    slug: input.slug,
    description: input.description ?? "",
    sort_order: input.sortOrder ?? 0,
    is_active: true
  });

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/menu");
}

export async function updateCategoryAction(
  categoryId: string,
  input: {
    name: string;
    slug: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("menu_categories")
    .update({
      name: input.name,
      slug: input.slug,
      description: input.description ?? "",
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
      updated_at: new Date().toISOString()
    })
    .eq("id", categoryId);

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/menu");
}

export async function deleteCategoryAction(categoryId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("menu_categories").delete().eq("id", categoryId);

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/menu");
}

export async function createMenuItemAction(input: {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
}) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("menu_items").insert({
    category_id: input.categoryId,
    name: input.name,
    description: input.description ?? "",
    price: input.price,
    image_url: input.imageUrl ?? "",
    is_available: input.isAvailable ?? true,
    is_featured: input.isFeatured ?? false,
    sort_order: input.sortOrder ?? 0
  });

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/menu");
}

export async function updateMenuItemAction(
  itemId: string,
  input: {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    isActive?: boolean;
    isAvailable?: boolean;
    isFeatured?: boolean;
    sortOrder?: number;
  }
) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("menu_items")
    .update({
      category_id: input.categoryId,
      name: input.name,
      description: input.description ?? "",
      price: input.price,
      image_url: input.imageUrl ?? "",
      is_active: input.isActive ?? true,
      is_available: input.isAvailable ?? true,
      is_featured: input.isFeatured ?? false,
      sort_order: input.sortOrder ?? 0,
      updated_at: new Date().toISOString()
    })
    .eq("id", itemId);

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/menu");
}

export async function deleteMenuItemAction(itemId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("menu_items").delete().eq("id", itemId);

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/menu");
}

export async function resetDemoAction() {
  try {
    const supabase = await requireAdmin();
    const staffRequestsResult = await supabase
      .from("staff_requests")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (staffRequestsResult.error) throw staffRequestsResult.error;

    const orderItemsResult = await supabase
      .from("order_items")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (orderItemsResult.error) throw orderItemsResult.error;

    const ordersResult = await supabase
      .from("orders")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (ordersResult.error) throw ordersResult.error;

    const tablesResult = await supabase.from("tables").update({ status: "available" }).eq("is_active", true);
    if (tablesResult.error) throw tablesResult.error;

    revalidatePath("/admin");
    revalidatePath("/kitchen");
    return { ok: true };
  } catch (error) {
    return adminActionError(error, "Could not reset demo data.");
  }
}
