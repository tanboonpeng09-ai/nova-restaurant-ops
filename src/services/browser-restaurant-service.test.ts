import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  createClient: vi.fn()
}));

vi.mock("@/lib/supabase/client", () => ({ createClient: supabaseMocks.createClient }));

import { fetchBrowserSnapshot } from "@/services/browser-restaurant-service";

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

describe("fetchBrowserSnapshot", () => {
  it("requests only browser-safe restaurant settings and returns no legacy PIN field", async () => {
    const settingsQuery = resolvedQuery({
      restaurant_name: "NOVA Steakhouse",
      tagline: "Prime steaks",
      description: "Modern steakhouse",
      phone: "555-0100",
      address: "1 Nova Way",
      brand_color: "#f97316",
      hero_image_url: "/hero.svg",
      ordering_enabled: true,
      closed_message: "Closed",
      kitchen_pin: "legacy-browser-pin"
    });
    const emptyQuery = resolvedQuery([]);
    const client = {
      from: vi.fn((table: string) => table === "restaurant_settings" ? settingsQuery : emptyQuery)
    };
    supabaseMocks.createClient.mockReturnValue(client);

    const snapshot = await fetchBrowserSnapshot();
    const selectedSettingsColumns = settingsQuery.select.mock.calls[0]?.[0] as string;

    expect(selectedSettingsColumns).not.toBe("*");
    expect(selectedSettingsColumns).not.toContain("kitchen_pin");
    expect(selectedSettingsColumns.split(",").map((column) => column.trim())).toEqual([
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
    expect(snapshot.settings).toMatchObject({
      name: "NOVA Steakhouse",
      orderingEnabled: true,
      closedMessage: "Closed"
    });
    expect(Object.hasOwn(snapshot.settings, "kitchenPin")).toBe(false);
    expect(JSON.stringify(snapshot)).not.toContain("legacy-browser-pin");

    type BrowserSettingsHasKitchenPin = "kitchenPin" extends keyof Awaited<
      ReturnType<typeof fetchBrowserSnapshot>
    >["settings"]
      ? true
      : false;
    expectTypeOf<BrowserSettingsHasKitchenPin>().toEqualTypeOf<false>();
  });
});
