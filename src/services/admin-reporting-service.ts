import type { SupabaseClient } from "@supabase/supabase-js";
import { buildAdminReport, type AdminReport, type ReportOrder } from "@/lib/reporting/admin-report";
import { getReportBounds, type ReportRange } from "@/lib/reporting/date-ranges";
import type { OrderStatus } from "@/types";

type ReportOrderRow = {
  id: string;
  order_number: string;
  table_number: string;
  status: OrderStatus;
  subtotal: string | number;
  created_at: string;
  order_items: Array<{
    id: string;
    item_name: string;
    quantity: number;
  }> | null;
};

export async function fetchAdminReport(
  supabase: SupabaseClient,
  range: ReportRange,
  timeZone: string,
  now = new Date()
): Promise<AdminReport> {
  const bounds = getReportBounds(range, timeZone, now);
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      table_number,
      status,
      subtotal,
      created_at,
      order_items (
        id,
        item_name,
        quantity
      )
    `)
    .gte("created_at", bounds.utcStart)
    .lt("created_at", bounds.utcEnd)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const orders = ((data ?? []) as ReportOrderRow[]).map(mapReportOrder);
  return buildAdminReport(orders, bounds);
}

function mapReportOrder(row: ReportOrderRow): ReportOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    tableNumber: row.table_number,
    status: row.status,
    subtotal: Number(row.subtotal),
    createdAt: row.created_at,
    items: (row.order_items ?? []).map((item) => ({
      id: item.id,
      itemName: item.item_name,
      quantity: item.quantity
    }))
  };
}
