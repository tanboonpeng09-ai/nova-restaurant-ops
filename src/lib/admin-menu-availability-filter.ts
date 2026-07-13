import type { MenuItem } from "@/types";

export type AvailabilityFilter = "all" | "available" | "sold_out";

export type AdminMenuAvailabilityFilters = {
  searchQuery: string;
  selectedCategoryId: string | null;
  availabilityFilter: AvailabilityFilter;
};

export type AdminMenuAvailabilityFilterResult = {
  items: MenuItem[];
  completeItemCount: number;
  completeSoldOutCount: number;
  selectedCategoryItemCount: number;
  postAvailabilityCount: number;
  normalizedSearchQuery: string;
};

export function normalizeAdminMenuAvailabilityText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function filterAdminMenuAvailability(
  menuItems: MenuItem[],
  { searchQuery, selectedCategoryId, availabilityFilter }: AdminMenuAvailabilityFilters
): AdminMenuAvailabilityFilterResult {
  const normalizedSearchQuery = normalizeAdminMenuAvailabilityText(searchQuery);
  const categoryItems = selectedCategoryId === null
    ? menuItems
    : menuItems.filter((item) => item.categoryId === selectedCategoryId);
  const availabilityItems = availabilityFilter === "all"
    ? categoryItems
    : categoryItems.filter((item) => item.isAvailable === (availabilityFilter === "available"));
  const items = normalizedSearchQuery
    ? availabilityItems.filter((item) =>
      normalizeAdminMenuAvailabilityText(item.name).includes(normalizedSearchQuery)
    )
    : availabilityItems;

  return {
    items,
    completeItemCount: menuItems.length,
    completeSoldOutCount: menuItems.filter((item) => !item.isAvailable).length,
    selectedCategoryItemCount: categoryItems.length,
    postAvailabilityCount: availabilityItems.length,
    normalizedSearchQuery
  };
}
