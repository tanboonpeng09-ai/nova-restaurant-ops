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
        <div className="mesh-panel rounded-card p-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Order not found</h1>
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
      <div className="mesh-panel rounded-card p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-ember">Order tracking</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white light:text-black">
          {currentOrder.orderNumber}
        </h1>
        <p className="mt-2 text-white/54 light:text-black/54">
          Table {currentOrder.tableNumber} / Order Value {currency(currentOrder.subtotal)}
        </p>
        <p className="mt-2 text-sm text-white/42 light:text-black/44">
          {syncError ?? (isRefreshing ? "Syncing latest status..." : "Live kitchen status")}
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`rounded-card border p-5 ${
                index <= current
                  ? "border-emerald-400/[0.24] bg-emerald-400/[0.08]"
                  : "border-white/[0.08] bg-white/[0.035] light:border-black/[0.07]"
              }`}
            >
              <CheckCircle2 className={index <= current ? "text-emerald-300" : "text-white/25 light:text-black/25"} />
              <p className="mt-4 font-semibold capitalize text-white light:text-black">
                {step === "new" ? "Submitted" : step}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8 space-y-3">
          {currentOrder.items.map((item) => (
            <div key={item.id} className="surface-soft flex justify-between rounded-2xl p-4">
              <span>
                {item.quantity}x {item.itemName}
              </span>
              <span>{currency(item.lineTotal)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
