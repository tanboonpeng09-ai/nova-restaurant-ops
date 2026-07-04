"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChefHat, LineChart, QrCode } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { restaurantConfig } from "@/config/restaurant";
import type { RestaurantSettings } from "@/types";

const featureCards = [
  {
    label: "Customer ordering",
    detail: "Guests scan, browse, add notes, and send orders from the table.",
    icon: QrCode,
    href: "/menu?table=1"
  },
  {
    label: "Kitchen live board",
    detail: "Clear order cards, staff requests, and one-tap status flow.",
    icon: ChefHat,
    href: "/kitchen"
  },
  {
    label: "Owner control",
    detail: "Menu availability, table status, QR sheets, and order value metrics.",
    icon: LineChart,
    href: "/admin"
  }
];

const previewMetrics = [
  { label: "Orders Today", value: "42", detail: "+18% vs last week" },
  { label: "Kitchen Live", value: "06", detail: "active tickets" },
  { label: "Average Prep Time", value: "12m", detail: "current service" }
];

export function HomePage({ settings }: { settings: RestaurantSettings }) {
  return (
    <div className="overflow-hidden">
      <section className="relative px-4 py-16 sm:px-6 lg:py-24">
        <div className="absolute inset-0 -z-10 opacity-30">
          <div
            className="h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${settings.heroImage})` }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_8%,rgba(255,107,44,0.16),transparent_24rem),linear-gradient(180deg,rgba(14,14,14,0.84),rgba(14,14,14,0.96)_48%,rgb(14,14,14))] light:bg-[radial-gradient(circle_at_25%_8%,rgba(255,107,44,0.11),transparent_24rem),linear-gradient(180deg,rgba(247,240,232,0.86),rgba(247,240,232,0.96)_48%,rgb(247,240,232))]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40 light:opacity-20" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.98fr_1.02fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-saffron">
              {settings.name}
            </p>
            <h1 className="mt-6 max-w-4xl text-[3.55rem] font-semibold leading-[0.96] tracking-[-0.02em] text-white light:text-black sm:text-[4.15rem] lg:text-[4.2rem] xl:text-[4.65rem]">
              Premium American Grill, Powered by Modern Restaurant Operations
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/66 light:text-black/64 sm:text-lg">
              QR ordering, kitchen visibility, and owner controls in one calm operating system.
              Built to help premium dining rooms move faster without feeling rushed.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/menu?table=1"
                className="pressable inline-flex min-h-14 items-center justify-center gap-2 rounded-button bg-ember px-7 py-4 font-semibold text-white shadow-[0_18px_42px_rgba(255,107,44,0.22)] hover:-translate-y-0.5 hover:shadow-[0_22px_54px_rgba(255,107,44,0.28)]"
              >
                Try Customer Demo <ArrowRight size={18} />
              </Link>
              <Link
                href="/admin"
                className="pressable inline-flex min-h-14 items-center justify-center gap-2 rounded-button border border-white/[0.13] bg-white/[0.035] px-7 py-4 font-semibold text-white hover:border-white/20 hover:bg-white/[0.07] light:border-black/[0.08] light:bg-white/58 light:text-black light:hover:bg-white"
              >
                View Admin System
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/45 light:text-black/46">
              <span>Table-aware QR menus</span>
              <span className="hidden h-1 w-1 rounded-full bg-white/25 light:bg-black/25 sm:block" />
              <span>Realtime kitchen workflow</span>
              <span className="hidden h-1 w-1 rounded-full bg-white/25 light:bg-black/25 sm:block" />
              <span>Owner-ready operations</span>
            </div>
          </motion.div>

          <motion.div
            className="rounded-card border border-white/[0.09] bg-white/[0.045] p-2.5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl light:border-black/[0.07] light:bg-white/68 light:shadow-[0_24px_70px_rgba(40,28,18,0.12)]"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12, duration: 0.55, ease: "easeOut" }}
          >
            <div className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-coal/88 light:border-black/[0.07] light:bg-white">
              <div className="relative h-56 sm:h-64">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${settings.heroImage})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/34 to-black/10" />
                <div className="absolute bottom-5 left-5 right-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-saffron">
                    Live floor preview
                  </p>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-2xl font-semibold text-white">
                        {restaurantConfig.demo.tableCount} tables
                      </p>
                      <p className="mt-1 text-sm text-white/62">Dinner service in progress</p>
                    </div>
                    <span className="rounded-full bg-emerald-400/[0.14] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100 ring-1 ring-emerald-300/20">
                      Online
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  {previewMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4 light:border-black/[0.06] light:bg-black/[0.025]"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/42 light:text-black/45">
                        {metric.label}
                      </p>
                      <p className="mt-3 text-2xl font-semibold tracking-tight text-white light:text-black">
                        {metric.value}
                      </p>
                      <p className="mt-1 text-xs text-white/46 light:text-black/48">{metric.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-white/[0.08] bg-black/22 p-4 light:border-black/[0.06] light:bg-black/[0.025]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white light:text-black">Kitchen queue</p>
                      <p className="mt-1 text-xs text-white/46 light:text-black/48">
                        New orders move from scan to station without refresh.
                      </p>
                    </div>
                    <ChefHat className="shrink-0 text-ember" size={22} />
                  </div>
                  <div className="mt-4 space-y-2">
                    {[
                      ["Table 04", "Preparing", "6 items"],
                      ["Table 09", "Ready", "2 items"],
                      ["Table 12", "New", "4 items"]
                    ].map(([table, status, items]) => (
                      <div
                        key={table}
                        className="flex items-center justify-between rounded-xl bg-white/[0.045] px-3 py-2 text-sm light:bg-white/72"
                      >
                        <span className="font-medium text-white light:text-black">{table}</span>
                        <span className="text-white/48 light:text-black/48">{items}</span>
                        <span className="rounded-full bg-ember/10 px-2.5 py-1 text-xs font-semibold text-ember">
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-ember/15 bg-ember/[0.06] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white light:text-black">Average ticket value</p>
                    <p className="mt-1 text-xs text-white/48 light:text-black/48">
                      Tracked as order value, not revenue.
                    </p>
                  </div>
                  <p className="text-xl font-semibold text-white light:text-black">$48.20</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <SectionHeading
          eyebrow="Restaurant operations"
          title="A complete service flow, presented simply."
          description="Three connected views give guests, kitchen staff, and owners exactly what they need without adding noise to service."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {featureCards.map((step) => (
            <Link
              href={step.href}
              key={step.label}
              className="interactive-card group rounded-card border border-white/[0.08] bg-white/[0.045] p-6 shadow-[0_18px_54px_rgba(0,0,0,0.18)] backdrop-blur-xl light:border-black/[0.07] light:bg-white/72 light:shadow-[0_18px_48px_rgba(40,28,18,0.1)]"
            >
              <span className="grid size-12 place-items-center rounded-button bg-ember/10 text-ember ring-1 ring-ember/15">
                <step.icon size={22} />
              </span>
              <h3 className="mt-6 text-[22px] font-semibold tracking-tight text-white light:text-black">
                {step.label}
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/55 light:text-black/56">{step.detail}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/64 group-hover:text-ember light:text-black/56">
                Open view <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
