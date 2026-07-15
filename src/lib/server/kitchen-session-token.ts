import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const KITCHEN_SESSION_MAX_AGE_SECONDS = 36_000;

const kitchenSessionVersion = 1;
const kitchenSessionScope = "kitchen";
const minimumSecretLength = 32;
const base64UrlPattern = /^[A-Za-z0-9_-]+$/;

export type KitchenSessionPayload = {
  v: 1;
  scope: "kitchen";
  iat: number;
  exp: number;
  nonce: string;
};

export function validateKitchenSessionSecret(secret: string) {
  const normalizedSecret = secret.trim();

  if (normalizedSecret.length < minimumSecretLength) {
    throw new Error("KITCHEN_SESSION_SECRET must contain at least 32 characters.");
  }

  return normalizedSecret;
}

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest();
}

function isKitchenSessionPayload(value: unknown): value is KitchenSessionPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const payload = value as Record<string, unknown>;
  return (
    payload.v === kitchenSessionVersion &&
    payload.scope === kitchenSessionScope &&
    Number.isInteger(payload.iat) &&
    Number.isInteger(payload.exp) &&
    typeof payload.iat === "number" &&
    typeof payload.exp === "number" &&
    payload.iat > 0 &&
    payload.exp > payload.iat &&
    typeof payload.nonce === "string" &&
    payload.nonce.length > 0 &&
    base64UrlPattern.test(payload.nonce) &&
    Object.keys(payload).length === 5
  );
}

export function createKitchenSessionToken(secret: string) {
  const normalizedSecret = validateKitchenSessionSecret(secret);
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: KitchenSessionPayload = {
    v: kitchenSessionVersion,
    scope: kitchenSessionScope,
    iat: issuedAt,
    exp: issuedAt + KITCHEN_SESSION_MAX_AGE_SECONDS,
    nonce: randomBytes(16).toString("base64url")
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = sign(encodedPayload, normalizedSecret).toString("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifyKitchenSessionToken(
  token: string,
  secret: string
): KitchenSessionPayload | null {
  const normalizedSecret = validateKitchenSessionSecret(secret);

  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [encodedPayload, encodedSignature] = parts;
    if (!encodedPayload || !encodedSignature) return null;
    if (!base64UrlPattern.test(encodedPayload) || !base64UrlPattern.test(encodedSignature)) return null;

    const expectedSignature = sign(encodedPayload, normalizedSecret);
    const receivedSignature = Buffer.from(encodedSignature, "base64url");
    if (receivedSignature.length !== expectedSignature.length) return null;
    if (receivedSignature.toString("base64url") !== encodedSignature) return null;
    if (!timingSafeEqual(receivedSignature, expectedSignature)) return null;

    const parsedPayload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as unknown;
    if (!isKitchenSessionPayload(parsedPayload)) return null;

    const currentTime = Math.floor(Date.now() / 1000);
    if (parsedPayload.iat > currentTime) return null;
    if (parsedPayload.exp - parsedPayload.iat > KITCHEN_SESSION_MAX_AGE_SECONDS) return null;
    if (parsedPayload.exp <= currentTime) return null;

    return parsedPayload;
  } catch {
    return null;
  }
}
