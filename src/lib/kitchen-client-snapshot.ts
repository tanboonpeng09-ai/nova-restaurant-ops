import type { RestaurantSnapshot } from "@/services/restaurant-service";

export type KitchenClientSnapshot = Omit<RestaurantSnapshot, "settings"> & {
  settings: Omit<RestaurantSnapshot["settings"], "kitchenPin">;
};

type SanitizableRestaurantSnapshot = Omit<RestaurantSnapshot, "settings"> & {
  settings: KitchenClientSnapshot["settings"] &
    Partial<Pick<RestaurantSnapshot["settings"], "kitchenPin">>;
};

export function sanitizeKitchenClientSnapshot(
  snapshot: SanitizableRestaurantSnapshot
): KitchenClientSnapshot {
  const { kitchenPin: legacyKitchenPin, ...settings } = snapshot.settings;
  void legacyKitchenPin;

  return {
    ...snapshot,
    settings
  };
}
