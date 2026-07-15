import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CartItem } from "@/types";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ isServiceRoleConfigured: () => false }));
vi.mock("@/lib/server/kitchen-session", () => ({
  KitchenSessionRequiredError: class KitchenSessionRequiredError extends Error {},
  requireKitchenSession: vi.fn()
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createOrderAction, createStaffRequestAction } from "@/actions/order-actions";
import { createClient } from "@/lib/supabase/server";

const cart: CartItem[] = [
  {
    menuItem: {
      id: "item-1",
      categoryId: "category-1",
      name: "Client-side name",
      description: "",
      price: 1,
      imageUrl: "",
      isAvailable: true,
      isFeatured: false,
      sortOrder: 1
    },
    quantity: 2
  }
];

type TableRow = { table_number: string; is_active: boolean; status: string } | null;

function createSupabaseHarness(table: TableRow) {
  const writes = { orders: 0, orderItems: 0, staffRequests: 0 };
  const insertedOrderItems: Array<Record<string, unknown>> = [];

  function chain(result: { data: unknown; error: unknown }) {
    const query = {
      eq: vi.fn(() => query),
      gte: vi.fn(() => query),
      order: vi.fn(() => query),
      limit: vi.fn(() => query),
      in: vi.fn(() => query),
      maybeSingle: vi.fn(async () => result),
      single: vi.fn(async () => result),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve)
    };
    return query;
  }

  const client = {
    from: vi.fn((name: string) => {
      if (name === "tables") {
        return {
          select: () => chain({ data: table, error: null }),
          update: () => ({ eq: async () => ({ error: null }) })
        };
      }
      if (name === "restaurant_settings") {
        return { select: () => chain({ data: { ordering_enabled: true }, error: null }) };
      }
      if (name === "menu_items") {
        return {
          select: () => chain({
            data: [{ id: "item-1", name: "Database item", price: 12.5 }],
            error: null
          })
        };
      }
      if (name === "orders") {
        return {
          select: () => chain({ data: [], error: null }),
          insert: () => {
            writes.orders += 1;
            return { select: () => chain({ data: { id: "order-1" }, error: null }) };
          }
        };
      }
      if (name === "order_items") {
        return {
          insert: async (rows: Array<Record<string, unknown>>) => {
            writes.orderItems += 1;
            insertedOrderItems.push(...rows);
            return { error: null };
          }
        };
      }
      if (name === "staff_requests") {
        return {
          select: () => chain({ data: null, error: null }),
          insert: () => {
            writes.staffRequests += 1;
            return { select: () => chain({ data: { id: "request-1" }, error: null }) };
          }
        };
      }
      throw new Error(`Unexpected table ${name}`);
    })
  };

  return { client, writes, insertedOrderItems };
}

beforeEach(() => vi.clearAllMocks());

describe("table validation in customer actions", () => {
  it.each([null, { table_number: "9", is_active: false, status: "available" }])(
    "creates no order or items for an invalid table",
    async (table) => {
      const harness = createSupabaseHarness(table);
      vi.mocked(createClient).mockResolvedValue(harness.client as never);

      await expect(createOrderAction({ tableNumber: table ? "9" : "99", notes: "", cart })).rejects.toThrow(
        "Scan your table QR code"
      );
      expect(harness.writes.orders).toBe(0);
      expect(harness.writes.orderItems).toBe(0);
    }
  );

  it("rejects a missing table before writing", async () => {
    const harness = createSupabaseHarness(null);
    vi.mocked(createClient).mockResolvedValue(harness.client as never);
    await expect(createOrderAction({ tableNumber: " ", notes: "", cart })).rejects.toThrow(
      "Scan your table QR code"
    );
    expect(harness.writes.orders).toBe(0);
  });

  it.each(["available", "occupied"])("creates an order for an active %s table", async (status) => {
    const harness = createSupabaseHarness({ table_number: "1", is_active: true, status });
    vi.mocked(createClient).mockResolvedValue(harness.client as never);

    await expect(createOrderAction({ tableNumber: "1", notes: "Keep notes", cart })).resolves.toBe("order-1");
    expect(harness.writes.orders).toBe(1);
    expect(harness.writes.orderItems).toBe(1);
    expect(harness.insertedOrderItems[0]).toMatchObject({
      item_name: "Database item",
      unit_price: 12.5,
      quantity: 2,
      line_total: 25
    });
  });

  it("allows a staff request only for a valid active table", async () => {
    const valid = createSupabaseHarness({ table_number: "1", is_active: true, status: "occupied" });
    vi.mocked(createClient).mockResolvedValue(valid.client as never);
    await expect(createStaffRequestAction({ tableNumber: "1", type: "water" })).resolves.toBe("request-1");
    expect(valid.writes.staffRequests).toBe(1);

    const invalid = createSupabaseHarness(null);
    vi.mocked(createClient).mockResolvedValue(invalid.client as never);
    await expect(createStaffRequestAction({ tableNumber: "99", type: "water" })).rejects.toThrow(
      "Scan your table QR code"
    );
    expect(invalid.writes.staffRequests).toBe(0);
  });
});
