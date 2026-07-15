import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionMocks = vi.hoisted(() => ({ readKitchenSession: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/kitchen-session", () => sessionMocks);

import { getInitialKitchenUnlockedState } from "@/lib/server/kitchen-page-session";
import { buildKitchenDashboardProps } from "@/lib/server/kitchen-page-session";
import { getDemoSnapshot } from "@/services/demo-snapshot";

beforeEach(() => {
  vi.clearAllMocks();
  sessionMocks.readKitchenSession.mockResolvedValue(null);
});

describe("Kitchen page session state", () => {
  it("returns unlocked for a valid server session", async () => {
    sessionMocks.readKitchenSession.mockResolvedValue({ v: 1, scope: "kitchen" });

    await expect(getInitialKitchenUnlockedState()).resolves.toBe(true);
  });

  it.each(["missing", "invalid", "expired"])("returns locked when the session Cookie is %s", async () => {
    await expect(getInitialKitchenUnlockedState()).resolves.toBe(false);
  });

  it("fails closed when session configuration cannot be read", async () => {
    sessionMocks.readKitchenSession.mockRejectedValue(new Error("private configuration details"));

    await expect(getInitialKitchenUnlockedState()).resolves.toBe(false);
  });

  it("removes the nested legacy PIN from the actual dashboard props", () => {
    const source = getDemoSnapshot();

    const props = buildKitchenDashboardProps(source, true);

    expect(Object.hasOwn(props.initialSnapshot.settings, "kitchenPin")).toBe(false);
    expect(JSON.stringify(props)).not.toContain(source.settings.kitchenPin);
    expect(props.initialSnapshot.settings.name).toBe(source.settings.name);
    expect(props.initialSnapshot.orders).toBe(source.orders);
    expect(props.initiallyUnlocked).toBe(true);
    expect(Object.keys(props)).toEqual(["initialSnapshot", "initiallyUnlocked"]);
  });

  it("builds the page through the sanitized dashboard-props boundary", () => {
    const source = readFileSync(path.resolve(process.cwd(), "src/app/kitchen/page.tsx"), "utf8");

    expect(source).toContain("getInitialKitchenUnlockedState");
    expect(source).toContain("buildKitchenDashboardProps");
    expect(source).toContain("<KitchenDashboard {...dashboardProps}");
  });
});
