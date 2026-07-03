import { HomePage } from "@/components/restaurant/home-page";
import { loadRestaurantSnapshot } from "@/services/snapshot-loader";

export const dynamic = "force-dynamic";

export default async function Page() {
  const snapshot = await loadRestaurantSnapshot();

  return <HomePage settings={snapshot.settings} />;
}
