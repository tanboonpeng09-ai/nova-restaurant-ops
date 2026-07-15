import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, expectTypeOf, it } from "vitest";
import { getDemoSnapshot } from "@/services/demo-snapshot";
import {
  sanitizeKitchenClientSnapshot,
  type KitchenClientSnapshot
} from "@/lib/kitchen-client-snapshot";
import {
  mapIncomingRestaurantSnapshot,
  mergeRestaurantSnapshotUpdates,
  useKitchenRestaurantRealtime,
  useRestaurantRealtime
} from "@/hooks/use-restaurant-realtime";

describe("mapIncomingRestaurantSnapshot", () => {
  it("applies the Kitchen sanitizer before a later full snapshot enters client state", () => {
    const incoming = getDemoSnapshot();
    incoming.settings = { ...incoming.settings, kitchenPin: "realtime-legacy-pin" };

    const result = mapIncomingRestaurantSnapshot(
      sanitizeKitchenClientSnapshot(incoming),
      sanitizeKitchenClientSnapshot
    );

    expect(Object.hasOwn(result.settings, "kitchenPin")).toBe(false);
    expect(JSON.stringify(result)).not.toContain("realtime-legacy-pin");
  });

  it("restricts the general hook to full snapshots and gives Kitchen a dedicated safe API", () => {
    type GeneralHookAcceptsKitchenSnapshot = KitchenClientSnapshot extends Parameters<
      typeof useRestaurantRealtime
    >[0]
      ? true
      : false;

    expectTypeOf<GeneralHookAcceptsKitchenSnapshot>().toEqualTypeOf<false>();
    expectTypeOf<Parameters<typeof useKitchenRestaurantRealtime>[0]>()
      .toEqualTypeOf<KitchenClientSnapshot>();
  });

  it("preserves safe settings through partial order, request, and table updates", () => {
    const current = sanitizeKitchenClientSnapshot(getDemoSnapshot());
    const orders = current.orders.slice(0, 1);
    const staffRequests: KitchenClientSnapshot["staffRequests"] = [];
    const tables = current.tables.slice(0, 2);

    const result = mergeRestaurantSnapshotUpdates(current, {
      orders,
      staffRequests,
      tables
    });

    expect(result.settings).toBe(current.settings);
    expect(Object.hasOwn(result.settings, "kitchenPin")).toBe(false);
    expect(result.orders).toBe(orders);
    expect(result.staffRequests).toBe(staffRequests);
    expect(result.tables).toBe(tables);
    expect(result.menuItems).toBe(current.menuItems);
  });

  it("does not expose an optional mapper or unchecked narrowed-snapshot cast", () => {
    const source = readFileSync(
      path.resolve(process.cwd(), "src/hooks/use-restaurant-realtime.ts"),
      "utf8"
    );

    expect(source).not.toContain("mapSnapshot?:");
    expect(source).not.toContain("as TSnapshot");
    expect(source).toContain("const clientInitialSnapshot = useMemo(");
    expect(source).toContain("() => sanitizeKitchenClientSnapshot(initialSnapshot)");
  });
});
