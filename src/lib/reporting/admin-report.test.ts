import { describe, expect, it } from "vitest";
import { getReportBounds } from "@/lib/reporting/date-ranges";
import {
  buildAdminReport,
  buildReportCsv,
  getReportCsvFilename,
  type AdminReport,
  type ReportOrder
} from "@/lib/reporting/admin-report";
import type { OrderStatus } from "@/types";

const bounds = getReportBounds(
  "today",
  "America/New_York",
  new Date("2026-07-11T16:00:00.000Z")
);

function order(
  id: string,
  status: OrderStatus,
  subtotal: number,
  createdAt: string,
  items: ReportOrder["items"] = []
): ReportOrder {
  return {
    id,
    orderNumber: `ORD-${id}`,
    tableNumber: "1",
    status,
    subtotal,
    createdAt,
    items
  };
}

describe("buildAdminReport", () => {
  it("returns zero-safe metrics and empty collections when no orders exist", () => {
    const report = buildAdminReport([], bounds);

    expect(report.metrics).toEqual({
      ordersPlaced: 0,
      completedOrders: 0,
      openOrders: 0,
      completedOrderSubtotal: 0,
      operationalOrderValue: 0,
      averageCompletedOrder: 0
    });
    expect(report.popularItems).toEqual([]);
    expect(report.busyHours).toEqual([]);
  });

  it("uses the approved mixed-status metric definitions", () => {
    const report = buildAdminReport(
      [
        order("new", "new", 10, "2026-07-11T12:15:00.000Z", [
          { id: "open-coffee", itemName: "Coffee", quantity: 4 }
        ]),
        order("preparing", "preparing", 20, "2026-07-11T12:45:00.000Z"),
        order("ready", "ready", 30, "2026-07-11T17:00:00.000Z"),
        order("completed-1", "completed", 40, "2026-07-11T13:00:00.000Z", [
          { id: "steak-1", itemName: "Steak", quantity: 2 }
        ]),
        order("completed-2", "completed", 60, "2026-07-11T14:00:00.000Z", [
          { id: "steak-2", itemName: "Steak", quantity: 1 },
          { id: "fries", itemName: "Fries", quantity: 2 }
        ])
      ],
      bounds
    );

    expect(report.metrics).toEqual({
      ordersPlaced: 5,
      completedOrders: 2,
      openOrders: 3,
      completedOrderSubtotal: 100,
      operationalOrderValue: 160,
      averageCompletedOrder: 50
    });
    expect(report.popularItems).toEqual([
      { itemName: "Steak", quantity: 3 },
      { itemName: "Fries", quantity: 2 }
    ]);
    expect(report.busyHours).toEqual([
      { hour: 8, label: "8 AM", orders: 2 },
      { hour: 9, label: "9 AM", orders: 1 },
      { hour: 10, label: "10 AM", orders: 1 },
      { hour: 13, label: "1 PM", orders: 1 }
    ]);
  });

  it("aggregates every order when the selected range contains more than 100", () => {
    const orders = Array.from({ length: 150 }, (_, index) =>
      order(String(index), "completed", 1, "2026-07-11T15:00:00.000Z")
    );

    const report = buildAdminReport(orders, bounds);

    expect(report.metrics.ordersPlaced).toBe(150);
    expect(report.metrics.completedOrders).toBe(150);
    expect(report.metrics.completedOrderSubtotal).toBe(150);
  });
});

describe("report CSV", () => {
  it("exports only report orders with local and UTC timestamps", () => {
    const report = buildAdminReport(
      [order("inside", "completed", 40, "2026-07-11T13:00:00.000Z")],
      bounds
    );
    const csv = buildReportCsv(report);

    expect(csv).toContain("Created Local");
    expect(csv).toContain("Created UTC");
    expect(csv).toContain("Jul 11, 2026, 9:00 AM");
    expect(csv).toContain("2026-07-11T13:00:00.000Z");
    expect(csv).toContain("ORD-inside");
    expect(csv).not.toContain("ORD-outside");
    expect(getReportCsvFilename("NOVA STEAKHOUSE", report)).toBe(
      "nova-steakhouse-orders-today-2026-07-11.csv"
    );
  });

  it("neutralizes spreadsheet formulas while preserving CSV quoting", () => {
    const report: AdminReport = {
      bounds,
      metrics: {
        ordersPlaced: 6,
        completedOrders: 6,
        openOrders: 0,
        completedOrderSubtotal: 0,
        operationalOrderValue: 0,
        averageCompletedOrder: 0
      },
      popularItems: [],
      busyHours: [],
      orders: [
        { ...order("formula-equals", "completed", 12, "2026-07-11T13:00:00.000Z"), orderNumber: "=SUM(A1:A2)" },
        { ...order("formula-plus", "completed", 12, "2026-07-11T13:00:00.000Z"), orderNumber: "+123" },
        { ...order("formula-minus", "completed", 12, "2026-07-11T13:00:00.000Z"), orderNumber: "-10" },
        { ...order("formula-at", "completed", 12, "2026-07-11T13:00:00.000Z"), orderNumber: "@command" },
        {
          ...order("formula-whitespace", "completed", 12, "2026-07-11T13:00:00.000Z"),
          orderNumber: "   =SUM(A1:A2)"
        },
        {
          ...order("normal", "completed", 12, "2026-07-11T13:00:00.000Z"),
          orderNumber: "ORD-\"quoted\", normal\nline",
          tableNumber: "Table, \"one\""
        }
      ]
    };

    const csv = buildReportCsv(report);

    expect(csv).toContain("\"'=SUM(A1:A2)\"");
    expect(csv).toContain("\"'+123\"");
    expect(csv).toContain("\"'-10\"");
    expect(csv).toContain("\"'@command\"");
    expect(csv).toContain("\"'   =SUM(A1:A2)\"");
    expect(csv).toContain("\"ORD-\"\"quoted\"\", normal\nline\"");
    expect(csv).toContain("\"Table, \"\"one\"\"\"");
    expect(csv).toContain("\"Subtotal\"");
    expect(csv).toContain("\"12\"");
  });
});
