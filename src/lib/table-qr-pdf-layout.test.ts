import { describe, expect, it } from "vitest";
import {
  A4_PAGE_HEIGHT_MM,
  A4_PAGE_WIDTH_MM,
  QR_CODES_PER_PAGE,
  QR_SIZE_MM,
  buildTableQrPdfLayout,
  sortTablesForQrPdf
} from "@/lib/table-qr-pdf-layout";
import type { Table } from "@/types";

function table(id: string, number: string, label = `Table ${number}`): Table {
  return {
    id,
    label,
    number,
    status: "available",
    qrUrl: "",
    isActive: true
  };
}

function makeTables(count: number): Table[] {
  return Array.from({ length: count }, (_, index) => table(`table-${index + 1}`, String(index + 1)));
}

describe("buildTableQrPdfLayout", () => {
  it.each([
    [0, 0],
    [1, 1],
    [9, 1],
    [12, 1],
    [13, 2],
    [15, 2],
    [24, 2],
    [25, 3]
  ])("lays out %i tables across %i page(s)", (tableCount, expectedPageCount) => {
    const layout = buildTableQrPdfLayout(makeTables(tableCount));

    expect(layout.pageCount).toBe(expectedPageCount);
    expect(layout.slots).toHaveLength(tableCount);
    expect(layout.slots.map((slot) => slot.table)).toEqual(layout.sortedTables);

    for (let pageIndex = 0; pageIndex < layout.pageCount; pageIndex += 1) {
      const pageSlots = layout.slots.filter((slot) => slot.pageIndex === pageIndex);
      const lastIndexOnPage = pageSlots.length - 1;

      expect(pageSlots).toHaveLength(Math.min(QR_CODES_PER_PAGE, tableCount - pageIndex * QR_CODES_PER_PAGE));
      expect(pageSlots[0]).toMatchObject({ pageIndex, rowIndex: 0, columnIndex: 0 });
      expect(pageSlots[lastIndexOnPage]).toMatchObject({
        pageIndex,
        rowIndex: Math.floor(lastIndexOnPage / 3),
        columnIndex: lastIndexOnPage % 3
      });
    }
  });

  it("starts items thirteen and twenty-five at the first slot of later pages", () => {
    const layout = buildTableQrPdfLayout(makeTables(25));

    expect(layout.slots[11]).toMatchObject({ pageIndex: 0, rowIndex: 3, columnIndex: 2 });
    expect(layout.slots[12]).toMatchObject({ pageIndex: 1, rowIndex: 0, columnIndex: 0 });
    expect(layout.slots[24]).toMatchObject({ pageIndex: 2, rowIndex: 0, columnIndex: 0 });
    expect(layout.slots.map((slot) => slot.table.number)).toEqual(layout.sortedTables.map((item) => item.number));
  });

  it("keeps QR codes and label baselines inside A4", () => {
    const layout = buildTableQrPdfLayout(makeTables(25));

    for (const slot of layout.slots) {
      expect(slot.x).toBeGreaterThanOrEqual(0);
      expect(slot.x + QR_SIZE_MM).toBeLessThanOrEqual(A4_PAGE_WIDTH_MM);
      expect(slot.y).toBeGreaterThanOrEqual(0);
      expect(slot.y + QR_SIZE_MM).toBeLessThanOrEqual(A4_PAGE_HEIGHT_MM);
      expect(slot.labelY).toBeGreaterThanOrEqual(0);
      expect(slot.labelY).toBeLessThanOrEqual(A4_PAGE_HEIGHT_MM);
    }
  });

  it("does not mutate the source or replace table objects", () => {
    const tables = [table("ten", "10"), table("two", "2"), ...makeTables(13)];
    const originalIds = tables.map((item) => item.id);
    const layout = buildTableQrPdfLayout(tables);

    expect(tables.map((item) => item.id)).toEqual(originalIds);
    expect(layout.sortedTables).toContain(tables[0]);
    expect(layout.sortedTables.find((item) => item.id === "two")).toBe(tables[1]);
  });
});

describe("sortTablesForQrPdf", () => {
  it("uses natural numeric ordering for table numbers", () => {
    const tables = ["12", "10", "2", "11", "9", "1"].map((number) => table(number, number));

    expect(sortTablesForQrPdf(tables).map((item) => item.label)).toEqual([
      "Table 1", "Table 2", "Table 9", "Table 10", "Table 11", "Table 12"
    ]);
  });

  it("sorts mixed table values case-insensitively and keeps duplicate keys stable", () => {
    const tables = [
      table("vip", "VIP 1", "vip 1"),
      table("patio-10", "Patio 10"),
      table("two-b", "Table 2B"),
      table("two-a", "Table 2A"),
      table("patio-1", "Patio 1"),
      table("duplicate-first", "2", "Table 2"),
      table("duplicate-second", "2", "table 2")
    ];

    const sorted = sortTablesForQrPdf(tables);

    expect(sorted.map((item) => item.id)).toEqual([
      "duplicate-first", "duplicate-second", "patio-1", "patio-10", "two-a", "two-b", "vip"
    ]);
    expect(tables.map((item) => item.id)).toEqual([
      "vip", "patio-10", "two-b", "two-a", "patio-1", "duplicate-first", "duplicate-second"
    ]);
    expect(sorted[0]).toBe(tables[5]);
  });
});
