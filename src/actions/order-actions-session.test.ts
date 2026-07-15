import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionMocks = vi.hoisted(() => {
  class KitchenSessionRequiredError extends Error {}
  return {
    KitchenSessionRequiredError,
    requireKitchenSession: vi.fn()
  };
});

const envMocks = vi.hoisted(() => ({ isServiceRoleConfigured: vi.fn(() => false) }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("redirected");
  })
}));
vi.mock("@/lib/env", () => envMocks);
vi.mock("@/lib/server/kitchen-session", () => sessionMocks);
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import {
  advanceOrderStatusAction,
  resolveStaffRequestAction,
  updateOrderStatusAction,
  updateTableStatusAction
} from "@/actions/order-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function mutationClient() {
  const writes: Array<{ table: string; values: Record<string, unknown>; id: string }> = [];
  const client = {
    from: vi.fn((table: string) => ({
      update: vi.fn((values: Record<string, unknown>) => ({
        eq: vi.fn(async (_column: string, id: string) => {
          writes.push({ table, values, id });
          return { error: null };
        })
      }))
    }))
  };
  return { client, writes };
}

function authenticatedAdminClient() {
  const mutation = mutationClient();
  const adminQuery = {
    eq: vi.fn(() => adminQuery),
    maybeSingle: vi.fn(async () => ({ data: { id: "admin-link" }, error: null }))
  };
  const client = {
    ...mutation.client,
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: "admin-user" } }, error: null }))
    },
    from: vi.fn((table: string) => {
      if (table === "admin_users") return { select: vi.fn(() => adminQuery) };
      return mutation.client.from(table);
    })
  };
  return { client, writes: mutation.writes };
}

beforeEach(() => {
  vi.clearAllMocks();
  envMocks.isServiceRoleConfigured.mockReturnValue(false);
  sessionMocks.requireKitchenSession.mockResolvedValue({ v: 1, scope: "kitchen" });
});

describe("Kitchen Session mutation authorization", () => {
  it("permits order advancement with a valid server session and no raw PIN", async () => {
    const harness = mutationClient();
    vi.mocked(createAdminClient).mockReturnValue(harness.client as never);

    await expect(
      advanceOrderStatusAction({ orderId: "order-1", currentStatus: "new" })
    ).resolves.toEqual({ ok: true });

    expect(sessionMocks.requireKitchenSession).toHaveBeenCalledOnce();
    expect(harness.writes).toEqual([
      { table: "orders", values: expect.objectContaining({ status: "preparing" }), id: "order-1" }
    ]);
    expect(sessionMocks.requireKitchenSession.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(createAdminClient).mock.invocationCallOrder[0]
    );
  });

  it("permits staff-request resolution with a valid server session and no raw PIN", async () => {
    const harness = mutationClient();
    vi.mocked(createAdminClient).mockReturnValue(harness.client as never);

    await expect(resolveStaffRequestAction({ requestId: "request-1" })).resolves.toEqual({ ok: true });

    expect(sessionMocks.requireKitchenSession).toHaveBeenCalledOnce();
    expect(harness.writes).toEqual([
      {
        table: "staff_requests",
        values: expect.objectContaining({ status: "resolved" }),
        id: "request-1"
      }
    ]);
  });

  it.each([
    ["missing", "advanceOrderStatusAction", () => advanceOrderStatusAction({ orderId: "order-1", currentStatus: "new" })],
    ["invalid", "advanceOrderStatusAction", () => advanceOrderStatusAction({ orderId: "order-1", currentStatus: "new" })],
    ["expired", "advanceOrderStatusAction", () => advanceOrderStatusAction({ orderId: "order-1", currentStatus: "new" })],
    ["missing", "resolveStaffRequestAction", () => resolveStaffRequestAction({ requestId: "request-1" })],
    ["invalid", "resolveStaffRequestAction", () => resolveStaffRequestAction({ requestId: "request-1" })],
    ["expired", "resolveStaffRequestAction", () => resolveStaffRequestAction({ requestId: "request-1" })]
  ])("rejects %s session for %s before any database write", async (_condition, _name, action) => {
    const harness = mutationClient();
    vi.mocked(createAdminClient).mockReturnValue(harness.client as never);
    sessionMocks.requireKitchenSession.mockRejectedValue(new sessionMocks.KitchenSessionRequiredError());

    await expect(action()).resolves.toEqual({
      ok: false,
      code: "KITCHEN_SESSION_REQUIRED",
      error: "Kitchen access expired. Enter the PIN to unlock again."
    });
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(harness.writes).toEqual([]);
  });

  it("fails safely when Kitchen Session configuration is unavailable", async () => {
    sessionMocks.requireKitchenSession.mockRejectedValue(
      new Error("KITCHEN_SESSION_SECRET private configuration details")
    );

    const result = await advanceOrderStatusAction({
      orderId: "order-1",
      currentStatus: "new"
    });

    expect(result).toEqual({
      ok: false,
      code: "KITCHEN_SESSION_REQUIRED",
      error: "Kitchen access expired. Enter the PIN to unlock again."
    });
    expect(JSON.stringify(result)).not.toContain("KITCHEN_SESSION_SECRET");
    expect(createAdminClient).not.toHaveBeenCalled();
  });
});

describe("Admin mutation authorization compatibility", () => {
  it("updates an order through authenticated Admin authorization without a Kitchen Session", async () => {
    const harness = authenticatedAdminClient();
    vi.mocked(createClient).mockResolvedValue(harness.client as never);

    await updateOrderStatusAction({ orderId: "order-1", status: "ready" });

    expect(sessionMocks.requireKitchenSession).not.toHaveBeenCalled();
    expect(harness.client.auth.getUser).toHaveBeenCalledOnce();
    expect(harness.writes[0]).toMatchObject({ table: "orders", id: "order-1" });
  });

  it("updates a table through authenticated Admin authorization without a Kitchen Session", async () => {
    const harness = authenticatedAdminClient();
    vi.mocked(createClient).mockResolvedValue(harness.client as never);

    await updateTableStatusAction({ tableId: "table-1", status: "occupied" });

    expect(sessionMocks.requireKitchenSession).not.toHaveBeenCalled();
    expect(harness.writes[0]).toMatchObject({ table: "tables", id: "table-1" });
  });

  it("rejects an unauthenticated Admin before an order write", async () => {
    const harness = authenticatedAdminClient();
    harness.client.auth.getUser.mockResolvedValue({ data: { user: null }, error: null } as never);
    vi.mocked(createClient).mockResolvedValue(harness.client as never);

    await expect(updateOrderStatusAction({ orderId: "order-1", status: "ready" })).rejects.toThrow(
      "redirected"
    );
    expect(harness.writes).toEqual([]);
  });
});
