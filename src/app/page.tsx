import { AppShell } from "@/components/shared/app-shell";
import { HomePage } from "@/components/restaurant/home-page";
import { restaurantConfig } from "@/config/restaurant";
import { loadRestaurantSnapshot } from "@/services/snapshot-loader";

export const dynamic = "force-dynamic";

export default async function Page() {
  const snapshot = await loadRestaurantSnapshot();
  const navigationLinks = [
    restaurantConfig.navigation.showMenuLink
      ? { label: restaurantConfig.navigation.menuLabel, href: "/menu" }
      : null,
    restaurantConfig.navigation.showKitchenLink
      ? { label: restaurantConfig.navigation.kitchenLabel, href: "/kitchen" }
      : null,
    restaurantConfig.navigation.showAdminLink
      ? { label: restaurantConfig.navigation.adminLabel, href: "/admin" }
      : null
  ].filter((item): item is { label: string; href: string } => item !== null);

  return (
    <AppShell
      logoClickable
      logoHref="/"
      logoAriaLabel="Go to NOVA showcase home"
      navigationLinks={navigationLinks}
      showTryDemoButton
    >
      <HomePage settings={snapshot.settings} />
    </AppShell>
  );
}
