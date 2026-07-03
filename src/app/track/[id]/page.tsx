import { OrderTracking } from "@/components/restaurant/order-tracking";
import { loadRestaurantSnapshot } from "@/services/snapshot-loader";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snapshot = await loadRestaurantSnapshot();
  const order = snapshot.orders.find((item) => item.id === id) ?? null;

  return <OrderTracking order={order} initialSnapshot={snapshot} />;
}
