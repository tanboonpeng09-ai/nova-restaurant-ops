import { describe, expect, it } from "vitest";
import {
  ADMIN_TABLE_PAGE_SIZE,
  filterAdminTables,
  getAdminTablePagination,
  normalizeAdminTableSearch
} from "@/lib/admin-table-operations";
import type { Table } from "@/types";

const tables: Table[] = [
  { id: "1", number: "1", label: "Table 1", status: "available", qrUrl: "", isActive: true },
  { id: "10", number: "10", label: "Table 10", status: "available", qrUrl: "", isActive: true },
  { id: "patio-1", number: "Patio 1", label: "Patio 1", status: "available", qrUrl: "", isActive: true },
  { id: "vip-1", number: "VIP 1", label: "VIP One", status: "available", qrUrl: "", isActive: true },
  { id: "2a", number: "2A", label: "Table 2A", status: "available", qrUrl: "", isActive: true }
];

describe("filterAdminTables", () => {
  it("normalizes surrounding and repeated whitespace with mixed case", () => {
    expect(normalizeAdminTableSearch(" TABLE   10 ")).toBe("table 10");
    expect(filterAdminTables(tables, " TABLE   10 ").map((table) => table.id)).toEqual(["10"]);
  });

  it.each([
    ["", ["1", "10", "patio-1", "vip-1", "2a"]],
    ["1", ["1"]],
    ["Table 1", ["1"]],
    ["10", ["10"]],
    ["Patio 1", ["patio-1"]],
    ["vip", ["vip-1"]],
    ["2A", ["2a"]],
    ["table 2", ["2a"]],
    ["missing", []]
  ])("filters %s without reordering the source", (query, expectedIds) => {
    expect(filterAdminTables(tables, query).map((table) => table.id)).toEqual(expectedIds);
  });

  it("preserves the source array and table object identities", () => {
    const originalIds = tables.map((table) => table.id);
    const result = filterAdminTables(tables, "1");

    expect(tables.map((table) => table.id)).toEqual(originalIds);
    expect(result[0]).toBe(tables[0]);
  });
});

describe("getAdminTablePagination", () => {
  it("exports an eight-table page size", () => {
    expect(ADMIN_TABLE_PAGE_SIZE).toBe(8);
  });

  it.each([
    [0, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 0, 1],
    [8, 1, 1, 1, 0, 8],
    [9, 2, 2, 2, 8, 9],
    [16, 2, 2, 2, 8, 16],
    [17, 3, 3, 3, 16, 17],
    [20, 3, 3, 3, 16, 20],
    [9, 0, 1, 2, 0, 8],
    [9, -2, 1, 2, 0, 8],
    [9, 99, 2, 2, 8, 9]
  ])(
    "paginates %i items for requested page %i",
    (totalItems, requestedPage, page, pageCount, startIndex, endIndex) => {
      expect(getAdminTablePagination(totalItems, requestedPage)).toEqual({
        page,
        pageCount,
        startIndex,
        endIndex
      });
    }
  );

  it("clamps a later page when the result total shrinks", () => {
    expect(getAdminTablePagination(20, 3).page).toBe(3);
    expect(getAdminTablePagination(9, 3)).toEqual({
      page: 2,
      pageCount: 2,
      startIndex: 8,
      endIndex: 9
    });
  });
});
