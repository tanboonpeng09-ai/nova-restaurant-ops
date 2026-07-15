import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  path.resolve(process.cwd(), "src/components/kitchen/kitchen-dashboard.tsx"),
  "utf8"
);
const configSource = readFileSync(
  path.resolve(process.cwd(), "src/config/restaurant.ts"),
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

  it("keeps the Kitchen PIN screen masked without exposing a credential", () => {
    expect(configSource).toContain('pinHelpText: "Enter your kitchen PIN to continue."');
    expect(configSource).toContain('pinPlaceholder: "Enter PIN"');
    expect(configSource).not.toContain("Demo PIN");
    expect(configSource).not.toContain("123456");
    expect(source).toContain('type={showPin ? "text" : "password"}');
    expect(source).toContain('aria-label={showPin ? "Hide PIN" : "Show PIN"}');
    expect(source).toContain('type="button"');
    expect(source).toContain("setShowPin((visible) => !visible)");
  });
});
