"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bell, ChefHat, LineChart, QrCode, TabletSmartphone } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { restaurantConfig } from "@/config/restaurant";
import type { RestaurantSettings } from "@/types";

const demoSteps = [
  { label: "Scan QR", detail: "Table-aware menu opens instantly.", icon: QrCode },
  { label: "Order", detail: "Guests add items, notes, and requests.", icon: TabletSmartphone },
  { label: "Kitchen", detail: "Realtime cards with clear next action.", icon: ChefHat },
  { label: "Admin", detail: "Tables, analytics, QR codes, settings.", icon: LineChart }
];

export function HomePage({ settings }: { settings: RestaurantSettings }) {
  return (
    <div>
      <section className="relative overflow-hidden px-4 py-14 sm:px-6 lg:py-20">
        <div className="absolute inset-0 -z-10 opacity-35">
          <div
            className="h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${settings.heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/92 to-ink light:from-cream light:via-cream/92 light:to-cream" />
        </div>
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-saffron">
              {settings.tagline}
            </p>
            <h1 className="mt-5 max-w-4xl font-display text-5xl font-semibold leading-[0.94] tracking-tight text-white light:text-black sm:text-7xl lg:text-[5.7rem]">
              {settings.name}
            </h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-8 text-white/68 light:text-black/64">
              {settings.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/menu?table=1"
                className="pressable inline-flex items-center justify-center gap-2 rounded-button bg-ember px-6 py-3.5 font-semibold text-white shadow-[0_18px_44px_rgba(255,107,44,0.25)] hover:-translate-y-0.5"
              >
                Try Customer Demo <ArrowRight size={18} />
              </Link>
              <Link
                href="/admin"
                className="pressable inline-flex items-center justify-center gap-2 rounded-button border border-white/[0.1] bg-white/[0.065] px-6 py-3.5 font-semibold text-white hover:bg-white/[0.09] light:border-black/[0.08] light:bg-white/72 light:text-black"
              >
                View Admin System
              </Link>
            </div>
          </motion.div>
          <motion.div
            className="mesh-panel rounded-card p-3.5"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12 }}
          >
            <div className="rounded-[20px] border border-white/[0.08] bg-black/32 p-4 light:bg-white/72">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/42 light:text-black/45">
                    Live dining room
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-white light:text-black">
                    {restaurantConfig.demo.tableCount} tables
                  </p>
                </div>
                <span className="rounded-full bg-emerald-400/[0.12] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200 ring-1 ring-emerald-400/20 light:text-emerald-700">
                  Online
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {["Available", "Occupied", "Needs Bill", "Cleaning"].map((status, index) => (
                  <div key={status} className="surface-soft rounded-2xl p-3.5">
                    <p className="text-2xl font-semibold text-white light:text-black">
                      {[5, 4, 2, 1][index]}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-white/48 light:text-black/50">{status}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-ember/20 bg-ember/[0.08] p-4">
                <div className="flex items-start gap-3">
                  <Bell className="mt-1 text-ember" size={20} />
                  <div>
                    <p className="font-semibold text-white light:text-black">New order received</p>
                    <p className="mt-1 text-sm leading-6 text-white/52 light:text-black/54">
                      {restaurantConfig.demo.sampleOrderSummary}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <SectionHeading
          eyebrow="Demo flow"
          title="One product story for customers, kitchen, and owner."
          description="The demo is intentionally built as a sales asset: a restaurant owner can open it, understand the workflow, and picture it operating on their floor."
        />
        <div className="mt-9 grid gap-4 md:grid-cols-4">
          {demoSteps.map((step) => (
            <Link
              href={step.label === "Kitchen" ? "/kitchen" : step.label === "Admin" ? "/admin" : "/menu?table=1"}
              key={step.label}
              className="interactive-card mesh-panel group rounded-card p-5"
            >
              <span className="grid size-10 place-items-center rounded-button bg-ember/10 text-ember ring-1 ring-ember/15">
                <step.icon size={19} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-white light:text-black">{step.label}</h3>
              <p className="mt-2 text-sm leading-6 text-white/52 light:text-black/54">{step.detail}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
