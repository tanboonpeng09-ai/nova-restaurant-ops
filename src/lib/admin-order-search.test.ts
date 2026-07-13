import { describe, expect, it } from "vitest";
import {
  matchesAdminOrderSearch,
  normalizeAdminOrderSearchQuery
} from "@/lib/admin-order-search";

describe("normalizeAdminOrderSearchQuery", () => {
  it.each([
    ["15", "15"],
    ["Table 15", "15"],
    ["table 15", "15"],
    ["TABLE 15", "15"],
    [" table   15 ", "15"]
  ])("normalizes %j to %j", (query, expected) => {
    expect(normalizeAdminOrderSearchQuery(query)).toBe(expected);
  });
});

describe("matchesAdminOrderSearch", () => {
  it("matches numeric and prefixed table searches equivalently", () => {
    for (const query of ["15", "Table 15", "table 15", "TABLE 15", " table   15 "]) {
      expect(matchesAdminOrderSearch("ORD-100", "15", query)).toBe(true);
    }
  });

  it("keeps partial order-number search functional", () => {
    expect(matchesAdminOrderSearch("ORD-TABLE-150", "9", "table-15")).toBe(true);
  });

  it("does not reinterpret an order number containing table as a table query", () => {
    expect(matchesAdminOrderSearch("ORD-TABLE-150", "9", "table")).toBe(true);
  });

  it("rejects a query that matches neither table nor order number", () => {
    expect(matchesAdminOrderSearch("ORD-100", "15", "table 99")).toBe(false);
  });
});
