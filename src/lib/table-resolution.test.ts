import { describe, expect, it } from "vitest";
import {
  buildTableMenuUrl,
  getActiveTables,
  resolveTableParameter
} from "@/lib/table-resolution";
import type { Table } from "@/types";

const tables: Table[] = [
  { id: "1", label: "Table 1", number: "1", status: "available", qrUrl: "", isActive: true },
  { id: "2", label: "Patio / 2", number: "Patio / 2", status: "occupied", qrUrl: "", isActive: true },
  { id: "3", label: "Table 3", number: "3", status: "available", qrUrl: "", isActive: false }
];

describe("resolveTableParameter", () => {
  it("accepts an active table after trimming whitespace", () => {
    expect(resolveTableParameter(" 1 ", tables)).toEqual({ status: "valid", table: tables[0] });
  });

  it.each([
    [null, "missing"],
    ["", "missing"],
    ["99", "invalid"],
    ["3", "inactive"]
  ] as const)("resolves %s as %s", (value, status) => {
    expect(resolveTableParameter(value, tables).status).toBe(status);
  });

  it("matches decoded special-character table numbers", () => {
    const value = new URL("https://example.test/menu?table=Patio%20%2F%202").searchParams.get("table");
    expect(resolveTableParameter(value, tables)).toEqual({ status: "valid", table: tables[1] });
  });
});

describe("table choices and URLs", () => {
  it("lists only active tables for the demo selector", () => {
    const unsortedTables: Table[] = [
      { id: "10", label: "Table 10", number: "10", status: "available", qrUrl: "", isActive: true },
      { id: "2", label: "Table 2", number: "2", status: "available", qrUrl: "", isActive: true },
      { id: "1", label: "Table 1", number: "1", status: "available", qrUrl: "", isActive: true },
      { id: "99", label: "Table 99", number: "99", status: "available", qrUrl: "", isActive: false }
    ];
    const originalOrder = unsortedTables.map((table) => table.id);

    expect(getActiveTables(unsortedTables).map((table) => table.label)).toEqual([
      "Table 1",
      "Table 2",
      "Table 10"
    ]);
    expect(unsortedTables.map((table) => table.id)).toEqual(originalOrder);
  });

  it("uses natural ordering for mixed table labels", () => {
    const mixedTables: Table[] = [
      { id: "patio-10", label: "Patio 10", number: "Patio 10", status: "available", qrUrl: "", isActive: true },
      { id: "a2", label: "A2", number: "A2", status: "available", qrUrl: "", isActive: true },
      { id: "table-2", label: "Table 2", number: "2", status: "available", qrUrl: "", isActive: true },
      { id: "patio-2", label: "Patio 2", number: "Patio 2", status: "available", qrUrl: "", isActive: true },
      { id: "a10", label: "A10", number: "A10", status: "available", qrUrl: "", isActive: true },
      { id: "table-10", label: "Table 10", number: "10", status: "available", qrUrl: "", isActive: true },
      { id: "patio-1", label: "Patio 1", number: "Patio 1", status: "available", qrUrl: "", isActive: true },
      { id: "a1", label: "A1", number: "A1", status: "available", qrUrl: "", isActive: true },
      { id: "table-1", label: "Table 1", number: "1", status: "available", qrUrl: "", isActive: true }
    ];

    expect(getActiveTables(mixedTables).map((table) => table.label)).toEqual([
      "A1",
      "A2",
      "A10",
      "Patio 1",
      "Patio 2",
      "Patio 10",
      "Table 1",
      "Table 2",
      "Table 10"
    ]);
  });

  it("encodes a table number with URLSearchParams", () => {
    expect(buildTableMenuUrl("https://nova.test/admin", "Patio / 2")).toBe(
      "https://nova.test/menu?table=Patio+%2F+2"
    );
  });
});
