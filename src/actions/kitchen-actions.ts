"use server";

import { timingSafeEqual } from "node:crypto";
import {
  clearKitchenSessionCookie,
  requireKitchenAccessPin,
  setKitchenSessionCookie
} from "@/lib/server/kitchen-session";

export type KitchenUnlockActionResult =
  | { ok: true }
  | { ok: false; error: string };

const invalidPinResult = { ok: false, error: "Invalid kitchen PIN." } as const;
const unavailableResult = {
  ok: false,
  error: "Kitchen access is unavailable. Please contact an administrator."
} as const;

function pinsMatch(submittedPin: string, expectedPin: string) {
  const submitted = Buffer.from(submittedPin, "utf8");
  const expected = Buffer.from(expectedPin, "utf8");

  if (submitted.length !== expected.length) return false;
  return timingSafeEqual(submitted, expected);
}

export async function unlockKitchenAction(pin: string): Promise<KitchenUnlockActionResult> {
  const submittedPin = pin.trim();
  if (!submittedPin) return invalidPinResult;

  let expectedPin: string;
  try {
    expectedPin = requireKitchenAccessPin();
  } catch {
    return unavailableResult;
  }

  if (!pinsMatch(submittedPin, expectedPin)) return invalidPinResult;

  try {
    await setKitchenSessionCookie();
    return { ok: true };
  } catch {
    return unavailableResult;
  }
}

export async function lockKitchenAction() {
  await clearKitchenSessionCookie();
  return { ok: true } as const;
}
