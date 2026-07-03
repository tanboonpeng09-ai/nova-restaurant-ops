import { KitchenDashboard } from "@/components/kitchen/kitchen-dashboard";
import { loadRestaurantSnapshot } from "@/services/snapshot-loader";

export const dynamic = "force-dynamic";

export default async function Page() {
  const snapshot = await loadRestaurantSnapshot();

  return <KitchenDashboard initialSnapshot={snapshot} />;
}
