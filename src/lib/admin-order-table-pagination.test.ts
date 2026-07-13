import { describe, expect, it } from "vitest";
import {
  ADMIN_ORDER_PAGE_SIZE,
  getAdminOrderTablePagination
} from "@/lib/admin-order-table-pagination";

describe("getAdminOrderTablePagination", () => {
  it("keeps an empty result on page 1 with an empty slice", () => {
    expect(getAdminOrderTablePagination(0, 4)).toEqual({
      page: 1,
      pageCount: 1,
      startIndex: 0,
      endIndex: 0
    });
  });

  it.each([
    [1, 1, 1, 0, 1],
    [15, 1, 1, 0, 15],
    [16, 1, 2, 0, 15],
    [30, 2, 2, 15, 30]
  ])(
    "paginates %i items on requested page %i",
    (totalItems, requestedPage, pageCount, startIndex, endIndex) => {
      expect(getAdminOrderTablePagination(totalItems, requestedPage)).toEqual({
        page: requestedPage,
        pageCount,
        startIndex,
        endIndex
      });
    }
  );

  it("exports the shared 15-order page size", () => {
    expect(ADMIN_ORDER_PAGE_SIZE).toBe(15);
  });

  it.each([
    [0, 1],
    [-3, 1],
    [99, 2]
  ])("clamps requested page %i to %i", (requestedPage, expectedPage) => {
    expect(getAdminOrderTablePagination(16, requestedPage).page).toBe(expectedPage);
  });

  it("clamps a later page when the item count shrinks", () => {
    expect(getAdminOrderTablePagination(46, 4)).toEqual({
      page: 4,
      pageCount: 4,
      startIndex: 45,
      endIndex: 46
    });

    expect(getAdminOrderTablePagination(16, 4)).toEqual({
      page: 2,
      pageCount: 2,
      startIndex: 15,
      endIndex: 16
    });
  });
});
