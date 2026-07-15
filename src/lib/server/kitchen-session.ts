import "server-only";

import { cookies } from "next/headers";
import {
  KITCHEN_SESSION_MAX_AGE_SECONDS,
  createKitchenSessionToken,
  validateKitchenSessionSecret,
  verifyKitchenSessionToken
} from "@/lib/server/kitchen-session-token";

export const KITCHEN_SESSION_COOKIE_NAME = "restaurant_os_kitchen_session";

function kitchenSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: KITCHEN_SESSION_MAX_AGE_SECONDS
  };
}

export class KitchenSessionRequiredError extends Error {
  constructor() {
    super("Kitchen session required.");
    this.name = "KitchenSessionRequiredError";
  }
}

export function requireKitchenAccessPin() {
  const pin = process.env.KITCHEN_ACCESS_PIN?.trim() ?? "";

  if (!pin) {
    throw new Error("Kitchen authentication is not configured: KITCHEN_ACCESS_PIN is required.");
  }

  return pin;
}

export function requireKitchenSessionSecret() {
  return validateKitchenSessionSecret(process.env.KITCHEN_SESSION_SECRET ?? "");
}

export async function readKitchenSession() {
  const secret = requireKitchenSessionSecret();
  const cookieStore = await cookies();
  const token = cookieStore.get(KITCHEN_SESSION_COOKIE_NAME)?.value;

  if (!token) return null;
  return verifyKitchenSessionToken(token, secret);
}

export async function setKitchenSessionCookie() {
  const token = createKitchenSessionToken(requireKitchenSessionSecret());
  const cookieStore = await cookies();

  cookieStore.set(KITCHEN_SESSION_COOKIE_NAME, token, kitchenSessionCookieOptions());
}

export async function clearKitchenSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(KITCHEN_SESSION_COOKIE_NAME, "", {
    ...kitchenSessionCookieOptions(),
    maxAge: 0
  });
}

export async function requireKitchenSession() {
  const session = await readKitchenSession();

  if (!session) throw new KitchenSessionRequiredError();
  return session;
}
