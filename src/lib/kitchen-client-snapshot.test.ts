import { describe, expect, expectTypeOf, it } from "vitest";
import { getDemoSnapshot } from "@/services/demo-snapshot";
import {
  sanitizeKitchenClientSnapshot,
  type KitchenClientSnapshot
} from "@/lib/kitchen-client-snapshot";

describe("sanitizeKitchenClientSnapshot", () => {
  it("removes the legacy Kitchen PIN property and value without mutating the source", () => {
    const source = getDemoSnapshot();

    const result = sanitizeKitchenClientSnapshot(source);

    expect(Object.hasOwn(result.settings, "kitchenPin")).toBe(false);
    expect(JSON.stringify(result)).not.toContain(source.settings.kitchenPin);
    expect(source.settings.kitchenPin).toBe("123456");
    expect(Object.hasOwn(source.settings, "kitchenPin")).toBe(true);
  });

  it("preserves all other settings and Kitchen snapshot collections", () => {
    const source = getDemoSnapshot();

    const result = sanitizeKitchenClientSnapshot(source);

    const { kitchenPin: _legacyKitchenPin, ...safeSettings } = source.settings;
    void _legacyKitchenPin;
    expect(result.settings).toEqual(safeSettings);
    expect(result.categories).toBe(source.categories);
    expect(result.menuItems).toBe(source.menuItems);
    expect(result.tables).toBe(source.tables);
    expect(result.orders).toBe(source.orders);
    expect(result.staffRequests).toBe(source.staffRequests);
  });

  it("sanitizes a later full snapshot before it can replace Kitchen client state", () => {
    const laterSnapshot = getDemoSnapshot();
    laterSnapshot.settings = { ...laterSnapshot.settings, kitchenPin: "later-legacy-pin" };

    const result = sanitizeKitchenClientSnapshot(laterSnapshot);

    expect(Object.hasOwn(result.settings, "kitchenPin")).toBe(false);
    expect(JSON.stringify(result)).not.toContain("later-legacy-pin");
  });

  it("structurally omits kitchenPin from the Kitchen client settings type", () => {
    type HasKitchenPin = "kitchenPin" extends keyof KitchenClientSnapshot["settings"]
      ? true
      : false;

    expectTypeOf<HasKitchenPin>().toEqualTypeOf<false>();
  });
});
