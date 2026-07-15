import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  createClient: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: supabaseMocks.createClient }));

import { getRestaurantSnapshot } from "@/services/restaurant-service";

function resolvedQuery(data: unknown) {
  const result = { data, error: null };
  const query = {
    select: vi.fn((columns?: string) => {
      void columns;
      return query;
    }),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    single: vi.fn(async () => result),
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  };

  return query;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getRestaurantSnapshot", () => {
  it("requests only the approved restaurant settings columns and maps the safe response", async () => {
    const settingsQuery = resolvedQuery({
      restaurant_name: "NOVA Steakhouse",
      tagline: "Premium dining",
      description: "Restaurant description",
      phone: "Restaurant phone",
      address: "Restaurant address",
      brand_color: "#f97316",
      hero_image_url: "/hero.svg",
      ordering_enabled: true,
      closed_message: "Ordering is closed"
    });
    const emptyQuery = resolvedQuery([]);
    const client = {
      from: vi.fn((table: string) => table === "restaurant_settings" ? settingsQuery : emptyQuery)
    };
    supabaseMocks.createClient.mockResolvedValue(client);

    const snapshot = await getRestaurantSnapshot();
    const selectedSettingsColumns = settingsQuery.select.mock.calls[0]?.[0] as string;
    const selectedColumns = selectedSettingsColumns.split(",").map((column) => column.trim());

    expect(selectedColumns).toEqual([
      "restaurant_name",
      "tagline",
      "description",
      "phone",
      "address",
      "brand_color",
      "hero_image_url",
      "ordering_enabled",
      "closed_message"
    ]);
    expect(selectedSettingsColumns).not.toBe("*");
    expect(selectedColumns).not.toContain("kitchen_pin");
    expect(selectedColumns).not.toContain("id");
    expect(selectedColumns).not.toContain("logo_url");
    expect(selectedColumns).not.toContain("created_at");
    expect(selectedColumns).not.toContain("updated_at");
    expect(snapshot.settings).toMatchObject({
      name: "NOVA Steakhouse",
      tagline: "Premium dining",
      description: "Restaurant description",
      phone: "Restaurant phone",
      address: "Restaurant address",
      brandColor: "#f97316",
      heroImage: "/hero.svg",
      orderingEnabled: true,
      closedMessage: "Ordering is closed"
    });
  });
});
