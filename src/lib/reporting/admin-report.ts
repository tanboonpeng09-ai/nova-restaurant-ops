import {
  formatHourLabel,
  formatReportLocalDateTime,
  getRestaurantHour,
  isWithinReportBounds,
  type ReportBounds,
  type ReportRange
} from "@/lib/reporting/date-ranges";
import type { OrderStatus } from "@/types";

export type ReportOrderItem = {
  id: string;
  itemName: string;
  quantity: number;
};

export type ReportOrder = {
  id: string;
  orderNumber: string;
  tableNumber: string;
  status: OrderStatus;
  subtotal: number;
  createdAt: string;
  items: ReportOrderItem[];
};

export type AdminReport = {
  bounds: ReportBounds;
  metrics: {
    ordersPlaced: number;
    completedOrders: number;
    openOrders: number;
    completedOrderSubtotal: number;
    operationalOrderValue: number;
    averageCompletedOrder: number;
  };
  popularItems: Array<{ itemName: string; quantity: number }>;
  busyHours: Array<{ hour: number; label: string; orders: number }>;
  orders: ReportOrder[];
};

export type AdminReportActionResult =
  | { ok: true; report: AdminReport }
  | { ok: false; error: string };

export function buildAdminReport(orders: ReportOrder[], bounds: ReportBounds): AdminReport {
  const rangeOrders = orders
    .filter((order) => isWithinReportBounds(order.createdAt, bounds))
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  const completedOrders = rangeOrders.filter((order) => order.status === "completed");
  const completedOrderSubtotal = completedOrders.reduce((sum, order) => sum + order.subtotal, 0);
  const operationalOrderValue = rangeOrders.reduce((sum, order) => sum + order.subtotal, 0);
  const itemCounts = new Map<string, number>();
  const ordersByHour = new Map<number, number>();

  completedOrders.forEach((order) => {
    order.items.forEach((item) => {
      itemCounts.set(item.itemName, (itemCounts.get(item.itemName) ?? 0) + item.quantity);
    });
  });

  rangeOrders.forEach((order) => {
    const hour = getRestaurantHour(order.createdAt, bounds.timeZone);
    ordersByHour.set(hour, (ordersByHour.get(hour) ?? 0) + 1);
  });

  return {
    bounds,
    metrics: {
      ordersPlaced: rangeOrders.length,
      completedOrders: completedOrders.length,
      openOrders: rangeOrders.length - completedOrders.length,
      completedOrderSubtotal,
      operationalOrderValue,
      averageCompletedOrder: completedOrders.length
        ? completedOrderSubtotal / completedOrders.length
        : 0
    },
    popularItems: [...itemCounts.entries()]
      .map(([itemName, quantity]) => ({ itemName, quantity }))
      .sort((left, right) => right.quantity - left.quantity || left.itemName.localeCompare(right.itemName)),
    busyHours: [...ordersByHour.entries()]
      .sort(([leftHour], [rightHour]) => leftHour - rightHour)
      .map(([hour, orders]) => ({ hour, label: formatHourLabel(hour), orders })),
    orders: rangeOrders
  };
}

export function buildReportCsv(report: AdminReport) {
  const rows = [
    ["Order Number", "Table", "Status", "Subtotal", "Created Local", "Created UTC"],
    ...report.orders.map((order) => [
      order.orderNumber,
      order.tableNumber,
      order.status,
      order.subtotal,
      formatReportLocalDateTime(order.createdAt, report.bounds.timeZone),
      new Date(order.createdAt).toISOString()
    ])
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function getReportCsvFilename(restaurantName: string, report: AdminReport) {
  return `${slugify(restaurantName)}-orders-${rangeSlug(report.bounds.range)}-${report.bounds.localStartDate}.csv`;
}

function csvCell(value: string | number) {
  const content = typeof value === "string" ? neutralizeSpreadsheetFormula(value) : String(value);
  return `"${content.replaceAll('"', '""')}"`;
}

function neutralizeSpreadsheetFormula(value: string) {
  return /^\s*[=+\-@]/.test(value) ? `'${value}` : value;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function rangeSlug(range: ReportRange) {
  return range.replaceAll("_", "-");
}
