"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Expand, Minimize, Moon, Sun } from "lucide-react";
import { Toaster } from "sonner";
import { restaurantConfig } from "@/config/restaurant";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [light, setLight] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pathname = usePathname();
  const isCustomerMenu = pathname === "/menu";
  const isKitchen = pathname === "/kitchen";
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const navigationLinks = (isKitchen ? [] : [
    restaurantConfig.navigation.showMenuLink
      ? [isAdminRoute ? "View Menu" : restaurantConfig.navigation.menuLabel, "/menu"]
      : null,
    restaurantConfig.navigation.showKitchenLink
      ? [restaurantConfig.navigation.kitchenLabel, "/kitchen"]
      : null,
    restaurantConfig.navigation.showAdminLink && !isAdminRoute
      ? [restaurantConfig.navigation.adminLabel, "/admin"]
      : null
  ]).filter((item): item is [string, string] => item !== null);

  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
  }, [light]);

  useEffect(() => {
    const updateFullscreenState = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", updateFullscreenState);

    return () => document.removeEventListener("fullscreenchange", updateFullscreenState);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
  }

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-ink/[0.82] backdrop-blur-2xl light:border-black/[0.07] light:bg-cream/[0.88]",
          isCustomerMenu && "hidden"
        )}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label={`${restaurantConfig.shortName} home`}>
            <span className="grid size-10 place-items-center rounded-button bg-ember text-white shadow-[0_12px_34px_rgba(255,107,44,0.26)]">
              <Image src={restaurantConfig.logoPath} alt="" width={22} height={22} priority />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-[0.22em]">{restaurantConfig.shortName}</span>
              <span className="block text-xs text-white/48 light:text-black/50">{restaurantConfig.productName}</span>
            </span>
          </Link>
          {navigationLinks.length > 0 && (
            <div className="hidden items-center gap-2 md:flex">
              {navigationLinks.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="rounded-button px-4 py-2 text-sm font-medium text-white/66 hover:bg-white/[0.07] hover:text-white light:text-black/62 light:hover:bg-black/[0.045]"
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLight((value) => !value)}
              className="pressable grid size-10 place-items-center rounded-button border border-white/[0.09] bg-white/[0.055] text-white hover:bg-white/[0.09] light:border-black/[0.08] light:bg-black/[0.045] light:text-black"
              aria-label="Toggle theme"
            >
              {light ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            {isKitchen && (
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="pressable grid size-10 place-items-center rounded-button border border-white/[0.09] bg-white/[0.055] text-white hover:bg-white/[0.09] light:border-black/[0.08] light:bg-black/[0.045] light:text-black"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize size={18} /> : <Expand size={18} />}
              </button>
            )}
            {!isKitchen && !isAdminRoute && restaurantConfig.navigation.showTryDemoButton && (
              <Link
                href="/menu"
                className={cn(
                  "pressable rounded-button bg-ember px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_34px_rgba(255,107,44,0.24)]",
                  "hover:-translate-y-0.5 hover:bg-[#ff7c42]"
                )}
              >
                {restaurantConfig.navigation.tryDemoLabel}
              </Link>
            )}
          </div>
        </nav>
      </header>
      <main className={cn("min-h-screen pt-16", isCustomerMenu && "pt-0")}>{children}</main>
      <Toaster
        richColors
        position="top-right"
        mobileOffset={{
          top: 16,
          bottom: "calc(6.75rem + env(safe-area-inset-bottom))"
        }}
      />
    </>
  );
}
