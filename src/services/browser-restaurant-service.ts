import { createClient } from "@/lib/supabase/client";
import {
  mapCategory,
  mapMenuItem,
  mapOrder,
  mapSettings,
  mapStaffRequest,
  mapTable
} from "@/lib/supabase/mappers";
import type { Category, MenuItem, Order, RestaurantSettings, StaffRequest, Table } from "@/types";

export async function fetchBrowserSnapshot() {
  const supabase = createClient();
  const [settingsResult, categoriesResult, menuItemsResult, tablesResult, ordersResult, requestsResult] =
    await Promise.all([
      supabase.from("restaurant_settings").select("*").limit(1).single(),
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
    settings: mapSettings(settingsResult.data) as RestaurantSettings,
    categories: (categoriesResult.data ?? []).map(mapCategory) as Category[],
    menuItems: (menuItemsResult.data ?? []).map(mapMenuItem) as MenuItem[],
    tables: (tablesResult.data ?? []).map(mapTable) as Table[],
    orders: (ordersResult.data ?? []).map(mapOrder) as Order[],
    staffRequests: (requestsResult.data ?? []).map(mapStaffRequest) as StaffRequest[]
  };
}

export async function fetchOrders() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

export async function fetchStaffRequests() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("staff_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []).map(mapStaffRequest);
}

export async function fetchTables() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .eq("is_active", true)
    .order("table_number", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapTable);
}
