import { createClient } from "@/lib/supabase/server";
import {
  mapCategory,
  mapMenuItem,
  mapOrder,
  mapSettings,
  mapStaffRequest,
  mapTable
} from "@/lib/supabase/mappers";
import type { Category, MenuItem, Order, RestaurantSettings, StaffRequest, Table } from "@/types";

const restaurantSettingsColumns =
  "restaurant_name,tagline,description,phone,address,brand_color,hero_image_url,ordering_enabled,closed_message";

export type RestaurantSnapshot = {
  settings: RestaurantSettings;
  categories: Category[];
  menuItems: MenuItem[];
  tables: Table[];
  orders: Order[];
  staffRequests: StaffRequest[];
};

export async function getRestaurantSnapshot(): Promise<RestaurantSnapshot> {
  const supabase = await createClient();

  const [settingsResult, categoriesResult, menuItemsResult, tablesResult, ordersResult, requestsResult] =
    await Promise.all([
      supabase.from("restaurant_settings").select(restaurantSettingsColumns).limit(1).single(),
      supabase
        .from("menu_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("menu_items")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase.from("tables").select("*").eq("is_active", true).order("table_number", { ascending: true }),
      supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("staff_requests").select("*").order("created_at", { ascending: false }).limit(100)
    ]);

  if (settingsResult.error) throw settingsResult.error;
  if (categoriesResult.error) throw categoriesResult.error;
  if (menuItemsResult.error) throw menuItemsResult.error;
  if (tablesResult.error) throw tablesResult.error;
  if (ordersResult.error) throw ordersResult.error;
  if (requestsResult.error) throw requestsResult.error;

  return {
    settings: mapSettings(settingsResult.data),
    categories: (categoriesResult.data ?? []).map(mapCategory),
    menuItems: (menuItemsResult.data ?? []).map(mapMenuItem),
    tables: (tablesResult.data ?? []).map(mapTable),
    orders: (ordersResult.data ?? []).map(mapOrder),
    staffRequests: (requestsResult.data ?? []).map(mapStaffRequest)
  };
}
