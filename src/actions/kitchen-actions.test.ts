import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionMocks = vi.hoisted(() => ({
  requireKitchenAccessPin: vi.fn(),
  setKitchenSessionCookie: vi.fn(),
  clearKitchenSessionCookie: vi.fn()
}));

vi.mock("@/lib/server/kitchen-session", () => sessionMocks);

import { lockKitchenAction, unlockKitchenAction } from "@/actions/kitchen-actions";

beforeEach(() => {
  vi.clearAllMocks();
  sessionMocks.requireKitchenAccessPin.mockReturnValue("123456");
  sessionMocks.setKitchenSessionCookie.mockResolvedValue(undefined);
  sessionMocks.clearKitchenSessionCookie.mockResolvedValue(undefined);
});

describe("unlockKitchenAction", () => {
  it("trims a correct PIN and creates the signed session Cookie", async () => {
    await expect(unlockKitchenAction("  123456  ")).resolves.toEqual({ ok: true });
    expect(sessionMocks.setKitchenSessionCookie).toHaveBeenCalledOnce();
  });

  it.each(["", "   ", "654321"])("rejects invalid PIN input %j without setting a Cookie", async (pin) => {
    await expect(unlockKitchenAction(pin)).resolves.toEqual({
      ok: false,
      error: "Invalid kitchen PIN."
    });
    expect(sessionMocks.setKitchenSessionCookie).not.toHaveBeenCalled();
  });

  it("returns a generic configuration failure without exposing server details", async () => {
    sessionMocks.requireKitchenAccessPin.mockImplementation(() => {
      throw new Error("KITCHEN_ACCESS_PIN private configuration details");
    });

    const result = await unlockKitchenAction("123456");

    expect(result).toEqual({
      ok: false,
      error: "Kitchen access is unavailable. Please contact an administrator."
    });
    expect(JSON.stringify(result)).not.toContain("KITCHEN_ACCESS_PIN");
    expect(JSON.stringify(result)).not.toContain("123456");
    expect(sessionMocks.setKitchenSessionCookie).not.toHaveBeenCalled();
  });

  it("does not expose the submitted PIN when Cookie creation fails", async () => {
    sessionMocks.setKitchenSessionCookie.mockRejectedValue(new Error("private signing failure"));

    const result = await unlockKitchenAction("123456");

    expect(result).toEqual({
      ok: false,
      error: "Kitchen access is unavailable. Please contact an administrator."
    });
    expect(JSON.stringify(result)).not.toContain("123456");
  });
});

describe("lockKitchenAction", () => {
  it("clears only the Kitchen Session Cookie through the Phase 0 primitive", async () => {
    await expect(lockKitchenAction()).resolves.toEqual({ ok: true });
    expect(sessionMocks.clearKitchenSessionCookie).toHaveBeenCalledOnce();
  });

  it("remains safe and idempotent when Kitchen is locked repeatedly", async () => {
    await expect(lockKitchenAction()).resolves.toEqual({ ok: true });
    await expect(lockKitchenAction()).resolves.toEqual({ ok: true });

    expect(sessionMocks.clearKitchenSessionCookie).toHaveBeenCalledTimes(2);
  });
});
