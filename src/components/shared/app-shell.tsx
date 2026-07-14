"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Expand, Minimize, Moon, Sun } from "lucide-react";
import { restaurantConfig } from "@/config/restaurant";
import { cn } from "@/lib/utils";

type NavigationLink = {
  label: string;
  href: string;
};

type AppShellProps = {
  children: React.ReactNode;
  logoHref?: string;
  logoAriaLabel?: string;
  logoClickable?: boolean;
  navigationLinks?: NavigationLink[];
  showTryDemoButton?: boolean;
  showFullscreenButton?: boolean;
};

export function AppShell({
  children,
  logoHref,
  logoAriaLabel,
  logoClickable = false,
  navigationLinks = [],
  showTryDemoButton = false,
  showFullscreenButton = false
}: AppShellProps) {
  const [light, setLight] = useState(() => {
    if (typeof document === "undefined") return false;

    return document.documentElement.classList.contains("light");
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const logo = (
    <>
      <span className="grid size-10 place-items-center rounded-button bg-ember text-white shadow-[0_12px_34px_rgba(255,107,44,0.26)]">
        <Image src={restaurantConfig.logoPath} alt="" width={22} height={22} priority />
      </span>
      <span>
        <span className="block text-sm font-semibold tracking-[0.22em]">{restaurantConfig.shortName}</span>
        <span className="block text-xs text-white/48 light:text-black/50">{restaurantConfig.productName}</span>
      </span>
    </>
  );

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
          "fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-ink/[0.82] backdrop-blur-2xl light:border-black/[0.07] light:bg-cream/[0.88]"
        )}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {logoClickable && logoHref ? (
            <Link
              href={logoHref}
              className="flex items-center gap-3 rounded-button outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-ink light:focus-visible:ring-offset-cream"
              aria-label={logoAriaLabel}
            >
              {logo}
            </Link>
          ) : (
            <div className="flex items-center gap-3">{logo}</div>
          )}
          {navigationLinks.length > 0 && (
            <div className="hidden items-center gap-2 md:flex">
              {navigationLinks.map(({ label, href }) => (
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
            {navigationLinks.length === 1 ? (
              <Link
                href={navigationLinks[0].href}
                className="pressable rounded-button border border-white/[0.09] bg-white/[0.055] px-3 py-2 text-sm font-medium text-white hover:bg-white/[0.09] light:border-black/[0.08] light:bg-black/[0.045] light:text-black md:hidden"
              >
                {navigationLinks[0].label}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setLight((value) => !value)}
              className="pressable grid size-10 place-items-center rounded-button border border-white/[0.09] bg-white/[0.055] text-white hover:bg-white/[0.09] light:border-black/[0.08] light:bg-black/[0.045] light:text-black"
              aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
            >
              {light ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            {showFullscreenButton && (
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
            {showTryDemoButton && restaurantConfig.navigation.showTryDemoButton && (
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
      <main className="min-h-screen pt-16">{children}</main>
    </>
  );
}
