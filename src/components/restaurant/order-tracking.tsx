"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import { AppShell } from "@/components/shared/app-shell";
import { useRestaurantRealtime } from "@/hooks/use-restaurant-realtime";
import { buildTableMenuUrl, normalizeTableNumber } from "@/lib/table-resolution";
import { currency } from "@/lib/utils";
import type { RestaurantSnapshot } from "@/services/restaurant-service";
import type { Order, OrderStatus } from "@/types";

const steps: OrderStatus[] = ["new", "preparing", "ready", "completed"];

const stepLabels: Record<OrderStatus, string> = {
  new: "Submitted",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed"
};

const stepSubtitles: Record<OrderStatus, string> = {
  new: "Order received",
  preparing: "Kitchen is working",
  ready: "Ready soon",
  completed: "Order completed"
};

export function OrderTracking({
  order,
  initialSnapshot
}: {
  order: Order | null;
  initialSnapshot: RestaurantSnapshot;
}) {
  const { snapshot, isRefreshing, syncError } = useRestaurantRealtime(initialSnapshot);
  const currentOrder = order ? snapshot.orders.find((item) => item.id === order.id) ?? order : null;

  if (!currentOrder) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-20">
          <div className="rounded-card border border-white/[0.08] bg-white/[0.05] p-8 text-center shadow-[0_22px_64px_rgba(0,0,0,0.2)] backdrop-blur-xl light:border-black/[0.07] light:bg-white/84">
            <h1 className="text-3xl font-semibold tracking-tight text-white light:text-black">Order not found</h1>
            <Link
              href="/menu"
              className="pressable mt-6 inline-flex rounded-button bg-ember px-5 py-3 font-semibold text-white"
            >
              Back to menu
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const tableNumber = normalizeTableNumber(currentOrder.tableNumber);
  const tableMenuUrl = tableNumber
    ? new URL(buildTableMenuUrl("https://nova-steakhouse.local", tableNumber))
    : null;
  const menuHref = tableMenuUrl ? `${tableMenuUrl.pathname}${tableMenuUrl.search}` : undefined;

  const current = steps.indexOf(currentOrder.status);
  const currentStatusLabel =
    currentOrder.status === "new"
      ? "Submitted"
      : currentOrder.status === "preparing"
        ? "Preparing"
        : currentOrder.status === "completed"
          ? "Completed"
          : "Ready";
  const currentStatusCopy =
    currentOrder.status === "new"
      ? "Your order is confirmed and waiting for the kitchen."
      : currentOrder.status === "preparing"
        ? "The kitchen is preparing your order now."
        : currentOrder.status === "completed"
          ? "This order has been completed."
          : "Your order is ready.";

  return (
    <AppShell
      logoClickable={Boolean(menuHref)}
      logoHref={menuHref}
      logoAriaLabel="Go to NOVA menu"
      navigationLinks={menuHref ? [{ label: "Back to Menu", href: menuHref }] : []}
    >
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <div className="rounded-card border border-white/[0.08] bg-white/[0.05] p-5 shadow-[0_22px_64px_rgba(0,0,0,0.2)] backdrop-blur-xl light:border-black/[0.07] light:bg-white/88 light:shadow-[0_18px_48px_rgba(40,28,18,0.1)] sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-ember">Live order status</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white light:text-black sm:text-6xl">
              {currentStatusLabel}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/62 light:text-black/60 sm:text-base">
              {currentStatusCopy}
            </p>
            <p className="mt-5 inline-flex rounded-full bg-white/[0.06] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/54 ring-1 ring-white/[0.07] light:bg-black/[0.035] light:text-black/54 light:ring-black/[0.055]">
              {currentOrder.orderNumber}
            </p>
            <p className="mt-4 flex items-center gap-2 text-sm text-white/52 light:text-black/52">
              <Clock3 size={15} className="text-saffron" />
              {syncError ?? (isRefreshing ? "Syncing latest status..." : "Live kitchen status")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-64">
            <div className="rounded-2xl border border-white/[0.08] bg-black/18 p-4 light:border-black/[0.06] light:bg-black/[0.025]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42 light:text-black/44">Table</p>
              <p className="mt-2 text-2xl font-semibold text-white light:text-black">{currentOrder.tableNumber}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-black/18 p-4 light:border-black/[0.06] light:bg-black/[0.025]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42 light:text-black/44">Order Value</p>
              <p className="mt-2 text-2xl font-semibold text-white light:text-black">{currency(currentOrder.subtotal)}</p>
            </div>
          </div>
        </div>

        <div className="mt-9 rounded-card border border-white/[0.08] bg-black/16 p-4 light:border-black/[0.06] light:bg-black/[0.025] sm:p-5">
          <div className="grid gap-4 sm:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step}
              className="relative"
            >
              {index < steps.length - 1 && (
                <div
                  className={`absolute left-5 top-5 hidden h-px w-[calc(100%+1rem)] sm:block ${
                    index < current ? "bg-emerald-300/45" : "bg-white/[0.09] light:bg-black/[0.08]"
                  }`}
                />
              )}
              <div
                className={`relative z-10 grid size-11 place-items-center rounded-full ring-1 ${
                  index === current
                    ? "bg-emerald-300 text-black shadow-[0_12px_28px_rgba(110,231,183,0.18)] ring-emerald-200/70"
                    : index < current
                      ? "bg-emerald-400/[0.14] text-emerald-200 ring-emerald-300/25"
                    : "bg-white/[0.05] text-white/28 ring-white/[0.08] light:bg-black/[0.04] light:text-black/28 light:ring-black/[0.08]"
                }`}
              >
                {index <= current ? <CheckCircle2 size={21} /> : <Circle size={21} />}
              </div>
              <p className="mt-4 font-semibold text-white light:text-black">{stepLabels[step]}</p>
              <p className="mt-1 text-sm text-white/45 light:text-black/45">{stepSubtitles[step]}</p>
            </div>
          ))}
          </div>
        </div>
        <div className="mt-7 space-y-3">
          {currentOrder.items.map((item) => (
            <div key={item.id} className="flex justify-between rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4 light:border-black/[0.07] light:bg-black/[0.025]">
              <span className="font-medium text-white light:text-black">
                {item.quantity}x {item.itemName}
              </span>
              <span className="font-semibold text-white/70 light:text-black/68">{currency(item.lineTotal)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    </AppShell>
  );
}
