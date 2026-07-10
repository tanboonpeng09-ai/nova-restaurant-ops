import type { Order } from "@/types";

export function getGenuinelyNewOrderIds(orders: Order[], knownOrderIds: ReadonlySet<string>) {
  return orders
    .filter((order) => order.status === "new" && !knownOrderIds.has(order.id))
    .map((order) => order.id);
}
