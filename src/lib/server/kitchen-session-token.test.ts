import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  KITCHEN_SESSION_MAX_AGE_SECONDS,
  createKitchenSessionToken,
  verifyKitchenSessionToken
} from "@/lib/server/kitchen-session-token";

const strongSecret = "test-only-kitchen-session-secret-1234567890";
const otherStrongSecret = "another-test-only-kitchen-session-secret-1234567890";
const now = Date.UTC(2026, 6, 15, 12, 0, 0);
const nowSeconds = Math.floor(now / 1000);

type TestPayload = {
  v: unknown;
  scope: unknown;
  iat: unknown;
  exp: unknown;
  nonce: unknown;
  [key: string]: unknown;
};

function decodePayload(token: string): TestPayload {
  const [encodedPayload] = token.split(".");
  return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as TestPayload;
}

function signEncodedPayload(encodedPayload: string, secret = strongSecret) {
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function signPayload(payload: unknown, secret = strongSecret) {
  return signEncodedPayload(Buffer.from(JSON.stringify(payload), "utf8").toString("base64url"), secret);
}

function validPayload(): TestPayload {
  return {
    v: 1,
    scope: "kitchen",
    iat: nowSeconds,
    exp: nowSeconds + KITCHEN_SESSION_MAX_AGE_SECONDS,
    nonce: "testnonce"
  };
}

describe("Kitchen session tokens", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("marks the runtime token module as server-only", () => {
    const source = readFileSync(path.resolve(process.cwd(), "src/lib/server/kitchen-session-token.ts"), "utf8");

    expect(source.startsWith('import "server-only";')).toBe(true);
  });

  it("creates and verifies a valid Kitchen-scoped version 1 token", () => {
    const token = createKitchenSessionToken(strongSecret);

    expect(verifyKitchenSessionToken(token, strongSecret)).toMatchObject({
      v: 1,
      scope: "kitchen"
    });
  });

  it("uses integer issue and expiry timestamps with an exact ten-hour lifetime", () => {
    const payload = decodePayload(createKitchenSessionToken(strongSecret));

    expect(Number.isInteger(payload.iat)).toBe(true);
    expect(Number.isInteger(payload.exp)).toBe(true);
    expect(payload.iat).toBe(nowSeconds);
    expect((payload.exp as number) - (payload.iat as number)).toBe(KITCHEN_SESSION_MAX_AGE_SECONDS);
    expect(payload.exp).toBe(nowSeconds + 36_000);
  });

  it("uses a non-empty cryptographically random nonce", () => {
    const first = decodePayload(createKitchenSessionToken(strongSecret));
    const second = decodePayload(createKitchenSessionToken(strongSecret));

    expect(first.nonce).toEqual(expect.stringMatching(/^[A-Za-z0-9_-]+$/));
    expect(second.nonce).toEqual(expect.stringMatching(/^[A-Za-z0-9_-]+$/));
    expect(first.nonce).not.toBe(second.nonce);
  });

  it.each(["", "payload-only", ".", "a.b.c", "%%%.$$$"])("rejects malformed token %j", (token) => {
    expect(verifyKitchenSessionToken(token, strongSecret)).toBeNull();
  });

  it("rejects an extra token section", () => {
    const token = createKitchenSessionToken(strongSecret);

    expect(verifyKitchenSessionToken(`${token}.extra`, strongSecret)).toBeNull();
  });

  it("rejects malformed base64url encoding", () => {
    expect(verifyKitchenSessionToken("payload.signature+", strongSecret)).toBeNull();
  });

  it("rejects correctly signed malformed JSON", () => {
    const encodedPayload = Buffer.from("{", "utf8").toString("base64url");

    expect(verifyKitchenSessionToken(signEncodedPayload(encodedPayload), strongSecret)).toBeNull();
  });

  it.each([
    { ...validPayload(), v: "1" },
    { ...validPayload(), scope: 1 },
    { ...validPayload(), iat: "1" },
    { ...validPayload(), exp: "2" },
    { ...validPayload(), nonce: 123 }
  ])("rejects invalid payload field types", (payload) => {
    expect(verifyKitchenSessionToken(signPayload(payload), strongSecret)).toBeNull();
  });

  it("rejects an unsupported token version", () => {
    expect(verifyKitchenSessionToken(signPayload({ ...validPayload(), v: 2 }), strongSecret)).toBeNull();
  });

  it("rejects an incorrect scope", () => {
    expect(verifyKitchenSessionToken(signPayload({ ...validPayload(), scope: "admin" }), strongSecret)).toBeNull();
  });

  it.each([
    {
      v: 1,
      scope: "kitchen",
      iat: nowSeconds,
      exp: nowSeconds + KITCHEN_SESSION_MAX_AGE_SECONDS
    },
    { ...validPayload(), nonce: "" },
    { ...validPayload(), nonce: "invalid nonce" }
  ])("rejects a missing or invalid nonce", (payload) => {
    expect(verifyKitchenSessionToken(signPayload(payload), strongSecret)).toBeNull();
  });

  it("rejects unexpected payload fields", () => {
    expect(verifyKitchenSessionToken(signPayload({ ...validPayload(), restaurant: "nova" }), strongSecret)).toBeNull();
  });

  it("rejects a modified payload", () => {
    const token = createKitchenSessionToken(strongSecret);
    const [, signature] = token.split(".");
    const encodedPayload = Buffer.from(
      JSON.stringify({ ...decodePayload(token), nonce: "modified" }),
      "utf8"
    ).toString("base64url");

    expect(verifyKitchenSessionToken(`${encodedPayload}.${signature}`, strongSecret)).toBeNull();
  });

  it("rejects a modified signature", () => {
    const token = createKitchenSessionToken(strongSecret);
    const [encodedPayload, signature] = token.split(".");
    const replacement = signature.startsWith("A") ? "B" : "A";

    expect(
      verifyKitchenSessionToken(`${encodedPayload}.${replacement}${signature.slice(1)}`, strongSecret)
    ).toBeNull();
  });

  it("rejects an invalid signature length before timing-safe comparison", () => {
    const token = createKitchenSessionToken(strongSecret);
    const [encodedPayload] = token.split(".");

    expect(verifyKitchenSessionToken(`${encodedPayload}.YQ`, strongSecret)).toBeNull();
  });

  it("rejects tokens signed with another secret", () => {
    const token = createKitchenSessionToken(strongSecret);

    expect(verifyKitchenSessionToken(token, otherStrongSecret)).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = createKitchenSessionToken(strongSecret);
    vi.setSystemTime(now + 36_000_000);

    expect(verifyKitchenSessionToken(token, strongSecret)).toBeNull();
  });

  it("rejects a correctly signed token issued in the future", () => {
    expect(
      verifyKitchenSessionToken(
        signPayload({
          ...validPayload(),
          iat: nowSeconds + 1,
          exp: nowSeconds + KITCHEN_SESSION_MAX_AGE_SECONDS
        }),
        strongSecret
      )
    ).toBeNull();
  });

  it.each([
    { ...validPayload(), exp: nowSeconds },
    { ...validPayload(), exp: nowSeconds - 1 }
  ])("rejects invalid expiry chronology", (payload) => {
    expect(verifyKitchenSessionToken(signPayload(payload), strongSecret)).toBeNull();
  });

  it("rejects a correctly signed token exceeding the maximum lifetime", () => {
    expect(
      verifyKitchenSessionToken(
        signPayload({ ...validPayload(), exp: nowSeconds + KITCHEN_SESSION_MAX_AGE_SECONDS + 1 }),
        strongSecret
      )
    ).toBeNull();
  });

  it.each(["", "   ", "too-short"])("rejects a missing, blank, or weak secret", (secret) => {
    expect(() => createKitchenSessionToken(secret)).toThrow("at least 32 characters");
  });

  it("does not disclose a rejected secret in its error", () => {
    const secret = "private-short-secret";

    expect(() => createKitchenSessionToken(secret)).toThrowError(
      expect.objectContaining({ message: expect.not.stringContaining(secret) })
    );
  });

  it("contains no Kitchen PIN, secret, user, Supabase, or restaurant data", () => {
    const fakePin = "test-pin-9876";
    const token = createKitchenSessionToken(strongSecret);
    const payload = decodePayload(token);
    const serializedPayload = JSON.stringify(payload);

    expect(token).not.toContain(fakePin);
    expect(token).not.toContain(strongSecret);
    expect(serializedPayload).not.toContain(fakePin);
    expect(Object.keys(payload).sort()).toEqual(["exp", "iat", "nonce", "scope", "v"]);
  });
});
