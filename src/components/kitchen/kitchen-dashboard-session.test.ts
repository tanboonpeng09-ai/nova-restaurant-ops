import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.resolve(process.cwd(), "src/components/kitchen/kitchen-dashboard.tsx"),
  "utf8"
);

describe("Kitchen dashboard session boundary", () => {
  it("initializes unlocked state from the server-provided boolean", () => {
    expect(source).toContain("initiallyUnlocked");
    expect(source).toContain("useState(initiallyUnlocked)");
    expect(source).toContain("KitchenClientSnapshot");
    expect(source).toContain("useKitchenRestaurantRealtime(initialSnapshot)");
    expect(source).not.toContain("useRestaurantRealtime(initialSnapshot");
  });

  it("uses unlock and lock actions without retaining a post-unlock PIN", () => {
    expect(source).toContain("unlockKitchenAction");
    expect(source).toContain("lockKitchenAction");
    expect(source).toContain('setPin("")');
    expect(source).not.toContain("verifyKitchenPinAction");
  });

  it("never sends a raw Kitchen PIN with mutation calls", () => {
    expect(source).not.toContain("kitchenPin");
    expect(source).toContain("advanceOrderStatusAction({");
    expect(source).toContain("resolveStaffRequestAction({ requestId: request.id })");
  });

  it("locks only for the recognizable Kitchen Session authorization result", () => {
    expect(source).toContain('result.code === "KITCHEN_SESSION_REQUIRED"');
    expect(source).toContain("setUnlocked(false)");
    expect(source).toContain("return false;");
  });
});
