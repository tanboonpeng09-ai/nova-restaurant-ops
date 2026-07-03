import {
  categories,
  menuItems,
  orders,
  restaurantSettings,
  staffRequests,
  tables
} from "@/lib/demo-data";
import type { RestaurantSnapshot } from "@/services/restaurant-service";

export function getDemoSnapshot(): RestaurantSnapshot {
  return {
    settings: restaurantSettings,
    categories,
    menuItems,
    tables,
    orders,
    staffRequests
  };
}
