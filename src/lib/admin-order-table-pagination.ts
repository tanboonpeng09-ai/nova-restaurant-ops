export const ADMIN_ORDER_PAGE_SIZE = 15;

export type AdminOrderTablePagination = {
  page: number;
  pageCount: number;
  startIndex: number;
  endIndex: number;
};

export function getAdminOrderTablePagination(
  totalItems: number,
  requestedPage: number,
  pageSize = ADMIN_ORDER_PAGE_SIZE
): AdminOrderTablePagination {
  const safeTotalItems = Number.isFinite(totalItems) ? Math.max(0, Math.trunc(totalItems)) : 0;
  const normalizedPageSize = Number.isFinite(pageSize) ? Math.trunc(pageSize) : 0;
  const safePageSize = normalizedPageSize > 0 ? normalizedPageSize : ADMIN_ORDER_PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(safeTotalItems / safePageSize));
  const safeRequestedPage = Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1;
  const page = Math.min(Math.max(1, safeRequestedPage), pageCount);
  const startIndex = (page - 1) * safePageSize;

  return {
    page,
    pageCount,
    startIndex,
    endIndex: Math.min(startIndex + safePageSize, safeTotalItems)
  };
}
