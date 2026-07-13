import type { Table } from "@/types";

export const ADMIN_TABLE_PAGE_SIZE = 8;

type AdminTableSearchable = Pick<Table, "number" | "label">;

export function normalizeAdminTableSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function filterAdminTables<T extends AdminTableSearchable>(tables: readonly T[], searchQuery: string): T[] {
  const normalizedSearchQuery = normalizeAdminTableSearch(searchQuery);
  if (!normalizedSearchQuery) return [...tables];

  const normalizedTableQuery = normalizedSearchQuery.replace(/^table\s+/, "");
  const exactTableMatches = tables.filter(
    (table) => normalizeAdminTableSearch(table.number) === normalizedTableQuery
  );
  if (exactTableMatches.length > 0) return exactTableMatches;

  return tables.filter((table) => {
    const normalizedNumber = normalizeAdminTableSearch(table.number);
    const normalizedLabel = normalizeAdminTableSearch(table.label);

    return (
      normalizedNumber.includes(normalizedSearchQuery) ||
      normalizedNumber.includes(normalizedTableQuery) ||
      normalizedLabel.includes(normalizedSearchQuery)
    );
  });
}

export function getAdminTablePagination(totalItems: number, requestedPage: number, pageSize = ADMIN_TABLE_PAGE_SIZE) {
  const safeTotalItems = Number.isFinite(totalItems) ? Math.max(0, Math.floor(totalItems)) : 0;
  const safePageSize = Number.isFinite(pageSize) && pageSize >= 1 ? Math.floor(pageSize) : ADMIN_TABLE_PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(safeTotalItems / safePageSize));
  const page = Math.min(Math.max(1, Math.floor(requestedPage) || 1), pageCount);
  const startIndex = (page - 1) * safePageSize;
  const endIndex = Math.min(startIndex + safePageSize, safeTotalItems);

  return { page, pageCount, startIndex, endIndex };
}
