export function normalizeAdminOrderSearchQuery(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/^table(?:\s+|$)/, "").trim();
}

export function matchesAdminOrderSearch(
  orderNumber: string,
  tableNumber: string,
  value: string
) {
  const normalizedQuery = value.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalizedQuery) return true;

  const normalizedTableQuery = normalizeAdminOrderSearchQuery(value);
  return (
    orderNumber.toLowerCase().includes(normalizedQuery) ||
    (normalizedTableQuery.length > 0 && tableNumber.toLowerCase().includes(normalizedTableQuery))
  );
}
