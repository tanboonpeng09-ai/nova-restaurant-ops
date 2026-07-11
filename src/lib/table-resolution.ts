import type { Table } from "@/types";

const naturalLabelCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base"
});

export type TableResolution =
  | { status: "valid"; table: Table }
  | { status: "missing" | "invalid" | "inactive"; table?: undefined };

export function normalizeTableNumber(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export function resolveTableParameter(
  value: string | null | undefined,
  tables: Table[]
): TableResolution {
  const tableNumber = normalizeTableNumber(value);
  if (!tableNumber) return { status: "missing" };

  const table = tables.find((candidate) => candidate.number === tableNumber);
  if (!table) return { status: "invalid" };
  if (!table.isActive) return { status: "inactive" };

  return { status: "valid", table };
}

export function getActiveTables(tables: Table[]) {
  return tables
    .filter((table) => table.isActive)
    .sort(
      (left, right) =>
        naturalLabelCollator.compare(left.label, right.label) ||
        naturalLabelCollator.compare(left.number, right.number)
    );
}

export function buildTableMenuUrl(baseUrl: string, tableNumber: string) {
  const url = new URL("/menu", baseUrl);
  url.searchParams.set("table", normalizeTableNumber(tableNumber));
  return url.toString();
}
