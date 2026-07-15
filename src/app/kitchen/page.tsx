import { KitchenDashboard } from "@/components/kitchen/kitchen-dashboard";
import {
  buildKitchenDashboardProps,
  getInitialKitchenUnlockedState
} from "@/lib/server/kitchen-page-session";
import { loadRestaurantSnapshot } from "@/services/snapshot-loader";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [snapshot, initiallyUnlocked] = await Promise.all([
    loadRestaurantSnapshot(),
    getInitialKitchenUnlockedState()
  ]);
  const dashboardProps = buildKitchenDashboardProps(snapshot, initiallyUnlocked);

  return <KitchenDashboard {...dashboardProps} />;
}
