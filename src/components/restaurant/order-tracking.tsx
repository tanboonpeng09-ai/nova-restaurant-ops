"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useRestaurantRealtime } from "@/hooks/use-restaurant-realtime";
import { currency } from "@/lib/utils";
import type { RestaurantSnapshot } from "@/services/restaurant-service";
import type { Order, OrderStatus } from "@/types";

const steps: OrderStatus[] = ["new", "preparing", "ready"];

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
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="rounded-card border border-white/[0.08] bg-white/[0.05] p-8 text-center shadow-[0_22px_64px_rgba(0,0,0,0.2)] backdrop-blur-xl light:border-black/[0.07] light:bg-white/84">
          <h1 className="text-3xl font-semibold tracking-tight text-white light:text-black">Order not found</h1>
          <Link
            href="/menu?table=1"
            className="pressable mt-6 inline-flex rounded-button bg-ember px-5 py-3 font-semibold text-white"
          >
            Back to menu
          </Link>
        </div>
      </div>
    );
  }

  const current = steps.indexOf(currentOrder.status === "completed" ? "ready" : currentOrder.status);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-card border border-white/[0.08] bg-white/[0.05] p-6 shadow-[0_22px_64px_rgba(0,0,0,0.2)] backdrop-blur-xl light:border-black/[0.07] light:bg-white/84 light:shadow-[0_18px_48px_rgba(40,28,18,0.1)] sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-ember">Order tracking</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white light:text-black sm:text-4xl">
              {currentOrder.orderNumber}
            </h1>
            <p className="mt-2 text-sm text-white/48 light:text-black/48">
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

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`relative overflow-hidden rounded-card border p-5 ${
                index <= current
                  ? "border-emerald-400/[0.24] bg-emerald-400/[0.08]"
                  : "border-white/[0.08] bg-white/[0.035] light:border-black/[0.07] light:bg-black/[0.02]"
              }`}
            >
              <div className={`grid size-10 place-items-center rounded-full ${
                index <= current ? "bg-emerald-400/[0.14] text-emerald-300" : "bg-white/[0.05] text-white/25 light:bg-black/[0.04] light:text-black/25"
              }`}>
                <CheckCircle2 size={20} />
              </div>
              <p className="mt-4 font-semibold capitalize text-white light:text-black">
                {step === "new" ? "Submitted" : step}
              </p>
              <p className="mt-1 text-sm text-white/45 light:text-black/45">
                {step === "new" ? "Order received" : step === "preparing" ? "Kitchen is working" : "Ready soon"}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8 space-y-3">
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
  );
}
