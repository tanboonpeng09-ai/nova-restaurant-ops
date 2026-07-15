import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieMocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  cookies: vi.fn()
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: cookieMocks.cookies }));

import {
  KITCHEN_SESSION_COOKIE_NAME,
  KitchenSessionRequiredError,
  clearKitchenSessionCookie,
  readKitchenSession,
  requireKitchenAccessPin,
  requireKitchenSession,
  requireKitchenSessionSecret,
  setKitchenSessionCookie
} from "@/lib/server/kitchen-session";

const testPin = "test-pin";
const testSecret = "test-only-kitchen-session-secret-1234567890";
const now = Date.UTC(2026, 6, 15, 12, 0, 0);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.clearAllMocks();
  vi.stubEnv("KITCHEN_ACCESS_PIN", `  ${testPin}  `);
  vi.stubEnv("KITCHEN_SESSION_SECRET", `  ${testSecret}  `);
  vi.stubEnv("NODE_ENV", "test");
  cookieMocks.cookies.mockResolvedValue({ get: cookieMocks.get, set: cookieMocks.set });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Kitchen session environment", () => {
  it("marks the runtime Cookie module as server-only", () => {
    const source = readFileSync(path.resolve(process.cwd(), "src/lib/server/kitchen-session.ts"), "utf8");

    expect(source.startsWith('import "server-only";')).toBe(true);
  });

  it("reads and trims the configured Kitchen PIN lazily", () => {
    expect(requireKitchenAccessPin()).toBe(testPin);
  });

  it.each([undefined, "", "   "])("rejects a missing or blank Kitchen PIN", (pin) => {
    if (pin === undefined) vi.stubEnv("KITCHEN_ACCESS_PIN", undefined);
    else vi.stubEnv("KITCHEN_ACCESS_PIN", pin);

    expect(() => requireKitchenAccessPin()).toThrow("KITCHEN_ACCESS_PIN is required");
  });

  it("reads, trims, and validates the configured session secret lazily", () => {
    expect(requireKitchenSessionSecret()).toBe(testSecret);
  });

  it.each([undefined, "", "   ", "too-short"])("rejects a missing, blank, or weak session secret", (secret) => {
    if (secret === undefined) vi.stubEnv("KITCHEN_SESSION_SECRET", undefined);
    else vi.stubEnv("KITCHEN_SESSION_SECRET", secret);

    expect(() => requireKitchenSessionSecret()).toThrow("at least 32 characters");
  });

  it("does not expose configured PIN or secret values in configuration errors", () => {
    const pin = "private-pin-for-error-check";
    const secret = "private-short-secret";
    vi.stubEnv("KITCHEN_ACCESS_PIN", pin);
    vi.stubEnv("KITCHEN_SESSION_SECRET", secret);

    let error: unknown;
    try {
      requireKitchenSessionSecret();
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toContain(pin);
    expect((error as Error).message).not.toContain(secret);
  });
});

describe("Kitchen session cookies", () => {
  it("uses the approved Cookie name", () => {
    expect(KITCHEN_SESSION_COOKIE_NAME).toBe("restaurant_os_kitchen_session");
  });

  it("sets a production HttpOnly host-only Cookie for ten hours", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await setKitchenSessionCookie();

    expect(cookieMocks.set).toHaveBeenCalledOnce();
    const [name, token, options] = cookieMocks.set.mock.calls[0];
    expect(name).toBe(KITCHEN_SESSION_COOKIE_NAME);
    expect(token).not.toContain(testPin);
    expect(token).not.toContain(testSecret);
    expect(options).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 36_000
    });
    expect(options).not.toHaveProperty("domain");
  });

  it("does not set Secure outside production", async () => {
    await setKitchenSessionCookie();

    expect(cookieMocks.set.mock.calls[0][2]).toMatchObject({ secure: false });
  });

  it("clears the Cookie using the same host-only scope and immediate expiry", async () => {
    await clearKitchenSessionCookie();

    expect(cookieMocks.set).toHaveBeenCalledWith(KITCHEN_SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 0
    });
  });

  it("returns null when the Cookie is missing", async () => {
    cookieMocks.get.mockReturnValue(undefined);

    await expect(readKitchenSession()).resolves.toBeNull();
  });

  it("returns null for an invalid Cookie without throwing", async () => {
    cookieMocks.get.mockReturnValue({ value: "malformed-cookie-value" });

    await expect(readKitchenSession()).resolves.toBeNull();
  });

  it("reads a valid Kitchen session", async () => {
    await setKitchenSessionCookie();
    const token = cookieMocks.set.mock.calls[0][1] as string;
    cookieMocks.get.mockReturnValue({ value: token });

    await expect(readKitchenSession()).resolves.toMatchObject({ v: 1, scope: "kitchen" });
  });

  it("returns a valid Session when one is required", async () => {
    await setKitchenSessionCookie();
    const token = cookieMocks.set.mock.calls[0][1] as string;
    cookieMocks.get.mockReturnValue({ value: token });

    await expect(requireKitchenSession()).resolves.toMatchObject({ v: 1, scope: "kitchen" });
  });

  it("throws the dedicated safe error when a Kitchen session is required", async () => {
    cookieMocks.get.mockReturnValue(undefined);

    await expect(requireKitchenSession()).rejects.toEqual(
      expect.objectContaining({
        name: "KitchenSessionRequiredError",
        message: "Kitchen session required."
      })
    );
    await expect(requireKitchenSession()).rejects.toBeInstanceOf(KitchenSessionRequiredError);
  });

  it("does not expose PIN, secret, token, or Cookie data in the required-session error", async () => {
    const invalidToken = "private-invalid-cookie-token";
    cookieMocks.get.mockReturnValue({ value: invalidToken });

    let error: unknown;
    try {
      await requireKitchenSession();
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).toBeInstanceOf(KitchenSessionRequiredError);
    const output = `${(error as Error).name}: ${(error as Error).message}`;
    expect(output).not.toContain(testPin);
    expect(output).not.toContain(testSecret);
    expect(output).not.toContain(invalidToken);
    expect(output).not.toContain(KITCHEN_SESSION_COOKIE_NAME);
  });
});
