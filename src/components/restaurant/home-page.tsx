"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChefHat, LineChart, QrCode } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { restaurantConfig } from "@/config/restaurant";
import type { RestaurantSettings } from "@/types";

const featureIcons = {
  qr: QrCode,
  chef: ChefHat,
  chart: LineChart
};

export function HomePage({ settings }: { settings: RestaurantSettings }) {
  const homeConfig = restaurantConfig.home;

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
              {homeConfig.headline}
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/66 light:text-black/64 sm:text-lg">
              {homeConfig.description}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/menu?table=1"
                className="pressable inline-flex min-h-14 items-center justify-center gap-2 rounded-button bg-ember px-7 py-4 font-semibold text-white shadow-[0_18px_42px_rgba(255,107,44,0.22)] hover:-translate-y-0.5 hover:shadow-[0_22px_54px_rgba(255,107,44,0.28)]"
              >
                {homeConfig.primaryCtaLabel} <ArrowRight size={18} />
              </Link>
              <Link
                href="/admin"
                className="pressable inline-flex min-h-14 items-center justify-center gap-2 rounded-button border border-white/[0.13] bg-white/[0.035] px-7 py-4 font-semibold text-white hover:border-white/20 hover:bg-white/[0.07] light:border-black/[0.08] light:bg-white/58 light:text-black light:hover:bg-white"
              >
                {homeConfig.secondaryCtaLabel}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/45 light:text-black/46">
              {homeConfig.proofPoints.map((proofPoint, index) => (
                <span key={proofPoint} className="contents">
                  {index > 0 && (
                    <span className="hidden h-1 w-1 rounded-full bg-white/25 light:bg-black/25 sm:block" />
                  )}
                  <span>{proofPoint}</span>
                </span>
              ))}
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
                    {homeConfig.previewEyebrow}
                  </p>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-2xl font-semibold text-white">
                        {restaurantConfig.demo.tableCount} tables
                      </p>
                      <p className="mt-1 text-sm text-white/62">{homeConfig.previewServiceLabel}</p>
                    </div>
                    <span className="rounded-full bg-emerald-400/[0.14] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100 ring-1 ring-emerald-300/20">
                      {homeConfig.previewStatusLabel}
                    </span>
                  </div>
                </div>
              </div>

                <div className="p-5 sm:p-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                  {homeConfig.previewMetrics.map((metric) => (
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
                      <p className="text-sm font-semibold text-white light:text-black">{homeConfig.queueTitle}</p>
                      <p className="mt-1 text-xs text-white/46 light:text-black/48">
                        {homeConfig.queueDescription}
                      </p>
                    </div>
                    <ChefHat className="shrink-0 text-ember" size={22} />
                  </div>
                  <div className="mt-4 space-y-2">
                    {homeConfig.queueRows.map(({ table, status, items }) => (
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
                    <p className="text-sm font-semibold text-white light:text-black">{homeConfig.averageTicketLabel}</p>
                    <p className="mt-1 text-xs text-white/48 light:text-black/48">
                      {homeConfig.averageTicketDescription}
                    </p>
                  </div>
                  <p className="text-xl font-semibold text-white light:text-black">{homeConfig.averageTicketValue}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <SectionHeading
          eyebrow={homeConfig.operationsEyebrow}
          title={homeConfig.operationsTitle}
          description={homeConfig.operationsDescription}
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {homeConfig.featureCards.map((step) => {
            const Icon = featureIcons[step.icon];

            return (
            <Link
              href={step.href}
              key={step.label}
              className="interactive-card group rounded-card border border-white/[0.08] bg-white/[0.045] p-6 shadow-[0_18px_54px_rgba(0,0,0,0.18)] backdrop-blur-xl light:border-black/[0.07] light:bg-white/72 light:shadow-[0_18px_48px_rgba(40,28,18,0.1)]"
            >
              <span className="grid size-12 place-items-center rounded-button bg-ember/10 text-ember ring-1 ring-ember/15">
                <Icon size={22} />
              </span>
              <h3 className="mt-6 text-[22px] font-semibold tracking-tight text-white light:text-black">
                {step.label}
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/55 light:text-black/56">{step.detail}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/64 group-hover:text-ember light:text-black/56">
                {homeConfig.featureCtaLabel} <ArrowRight size={15} />
              </span>
            </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
