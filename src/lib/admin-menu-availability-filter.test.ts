import { describe, expect, it } from "vitest";
import {
  filterAdminMenuAvailability,
  type AvailabilityFilter
} from "@/lib/admin-menu-availability-filter";
import type { MenuItem } from "@/types";

function item(
  id: string,
  categoryId: string,
  name: string,
  isAvailable: boolean
): MenuItem {
  return {
    id,
    categoryId,
    name,
    isAvailable,
    description: "",
    price: 10,
    imageUrl: "",
    isFeatured: false,
    sortOrder: 0
  };
}

const menuItems = [
  item("ribeye", "steaks", "Prime Ribeye", true),
  item("strip", "steaks", "New York Strip", false),
  item("caesar", "starters", "Caesar Salad", true),
  item("truffle", "sides", "Truffle Fries", false)
];

function filter(
  searchQuery = "",
  selectedCategoryId: string | null = null,
  availabilityFilter: AvailabilityFilter = "all"
) {
  return filterAdminMenuAvailability(menuItems, {
    searchQuery,
    selectedCategoryId,
    availabilityFilter
  });
}

describe("filterAdminMenuAvailability", () => {
  it("returns the complete snapshot and counts for an empty search", () => {
    const result = filter();

    expect(result.items).toEqual(menuItems);
    expect(result.completeItemCount).toBe(4);
    expect(result.completeSoldOutCount).toBe(2);
    expect(result.selectedCategoryItemCount).toBe(4);
    expect(result.postAvailabilityCount).toBe(4);
    expect(result.normalizedSearchQuery).toBe("");
  });

  it.each([
    [" ribeye ", ["ribeye"]],
    ["PRIME   RIBEYE", ["ribeye"]],
    ["sal", ["caesar"]],
    ["missing", []]
  ])("trims, normalizes, and partially matches item-name searches", (searchQuery, expectedIds) => {
    expect(filter(searchQuery).items.map((menuItem) => menuItem.id)).toEqual(expectedIds);
  });

  it("filters a selected category while preserving snapshot order", () => {
    const result = filter("", "steaks");

    expect(result.items.map((menuItem) => menuItem.id)).toEqual(["ribeye", "strip"]);
    expect(result.selectedCategoryItemCount).toBe(2);
    expect(result.postAvailabilityCount).toBe(2);
  });

  it("keeps a selected category with no items distinct from all categories", () => {
    const result = filter("", "desserts");

    expect(result.items).toEqual([]);
    expect(result.selectedCategoryItemCount).toBe(0);
    expect(result.postAvailabilityCount).toBe(0);
  });

  it.each([
    ["all", ["ribeye", "strip", "caesar", "truffle"]],
    ["available", ["ribeye", "caesar"]],
    ["sold_out", ["strip", "truffle"]]
  ])("filters availability state", (availabilityFilter, expectedIds) => {
    expect(filter("", null, availabilityFilter as AvailabilityFilter).items.map((menuItem) => menuItem.id)).toEqual(expectedIds);
  });

  it("applies category, availability, and name search in that order", () => {
    expect(filter("prime", "steaks", "available").items.map((menuItem) => menuItem.id)).toEqual(["ribeye"]);
    expect(filter("", "steaks", "sold_out").items.map((menuItem) => menuItem.id)).toEqual(["strip"]);
    expect(filter("sal", null, "available").items.map((menuItem) => menuItem.id)).toEqual(["caesar"]);
    expect(filter("fries", "sides", "sold_out").items.map((menuItem) => menuItem.id)).toEqual(["truffle"]);
    expect(filter("prime", "sides", "available").items).toEqual([]);
  });

  it("reports complete and intermediate counts for combined filters", () => {
    const result = filter("prime", "steaks", "available");

    expect(result.completeItemCount).toBe(4);
    expect(result.completeSoldOutCount).toBe(2);
    expect(result.selectedCategoryItemCount).toBe(2);
    expect(result.postAvailabilityCount).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.normalizedSearchQuery).toBe("prime");
  });

  it("does not mutate the source or replace matching item objects", () => {
    const originalIds = menuItems.map((menuItem) => menuItem.id);
    const result = filter("", null, "sold_out");

    expect(result.items).toEqual([menuItems[1], menuItems[3]]);
    expect(result.items[0]).toBe(menuItems[1]);
    expect(menuItems.map((menuItem) => menuItem.id)).toEqual(originalIds);
  });
});
