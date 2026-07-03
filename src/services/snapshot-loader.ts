import { isSupabaseConfigured } from "@/lib/env";
import { getDemoSnapshot } from "@/services/demo-snapshot";
import { getRestaurantSnapshot } from "@/services/restaurant-service";

export async function loadRestaurantSnapshot() {
  if (!isSupabaseConfigured()) return getDemoSnapshot();

  try {
    return await getRestaurantSnapshot();
  } catch (error) {
    console.error("Failed to load Supabase snapshot", error);
    return getDemoSnapshot();
  }
}
