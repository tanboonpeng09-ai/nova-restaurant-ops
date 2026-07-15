import "server-only";

import { sanitizeKitchenClientSnapshot } from "@/lib/kitchen-client-snapshot";
import { readKitchenSession } from "@/lib/server/kitchen-session";
import type { RestaurantSnapshot } from "@/services/restaurant-service";

export function buildKitchenDashboardProps(
  snapshot: RestaurantSnapshot,
  initiallyUnlocked: boolean
) {
  return {
    initialSnapshot: sanitizeKitchenClientSnapshot(snapshot),
    initiallyUnlocked
  };
}

export async function getInitialKitchenUnlockedState() {
  try {
    return Boolean(await readKitchenSession());
  } catch {
    return false;
  }
}
