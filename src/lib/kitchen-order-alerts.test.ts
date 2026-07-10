import { describe, expect, it } from "vitest";
import { getGenuinelyNewOrderIds } from "@/lib/kitchen-order-alerts";
import type { Order } from "@/types";

const order = (id: string, status: Order["status"] = "new"): Order => ({
  id,
  orderNumber: `ORD-${id}`,
  tableNumber: "1",
  status,
  subtotal: 12,
  notes: "",
  items: [],
  createdAt: "2026-07-10T00:00:00.000Z",
  updatedAt: "2026-07-10T00:00:00.000Z"
});

describe("getGenuinelyNewOrderIds", () => {
  it("returns only unseen orders that arrive with new status", () => {
    expect(getGenuinelyNewOrderIds([order("existing"), order("incoming"), order("preparing", "preparing")], new Set(["existing"]))).toEqual([
      "incoming"
    ]);
  });

  it("does not return duplicate, completed, or status-transition orders", () => {
    expect(
      getGenuinelyNewOrderIds(
        [order("existing", "preparing"), order("completed", "completed"), order("duplicate")],
        new Set(["existing", "duplicate"])
      )
    ).toEqual([]);
  });
});
