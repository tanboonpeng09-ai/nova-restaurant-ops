import { Suspense } from "react";
import { MenuPage } from "@/components/restaurant/menu-page";
import { loadRestaurantSnapshot } from "@/services/snapshot-loader";

export const dynamic = "force-dynamic";

export default async function Page() {
  const snapshot = await loadRestaurantSnapshot();

  return (
    <Suspense fallback={<div className="px-6 py-20">Loading menu...</div>}>
      <MenuPage initialSnapshot={snapshot} />
    </Suspense>
  );
}
