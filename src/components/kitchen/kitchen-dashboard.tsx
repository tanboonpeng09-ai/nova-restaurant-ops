"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, ChefHat, LockKeyhole, Volume2 } from "lucide-react";
import { toast } from "sonner";
import {
  advanceOrderStatusAction,
  resolveStaffRequestAction,
  verifyKitchenPinAction
} from "@/actions/order-actions";
import { useRestaurantRealtime } from "@/hooks/use-restaurant-realtime";
import { StatusBadge } from "@/components/shared/status-badge";
import { isSupabaseConfigured } from "@/lib/env";
import { currency, statusLabel } from "@/lib/utils";
import type { RestaurantSnapshot } from "@/services/restaurant-service";

export function KitchenDashboard({ initialSnapshot }: { initialSnapshot: RestaurantSnapshot }) {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const {
    snapshot,
    refreshOrders,
    refreshRequests,
    isRefreshing,
    syncError,
    isRealtimeConnected
  } = useRestaurantRealtime(initialSnapshot);
  const { settings, orders, staffRequests } = snapshot;

  const activeOrders = useMemo(
    () => orders.filter((order) => order.status !== "completed"),
    [orders]
  );
  const openRequests = staffRequests.filter((request) => request.status === "open");

  useEffect(() => {
    if (unlocked && activeOrders[0]) {
      document.title = `${activeOrders.length} active orders - Kitchen`;
    }
  }, [activeOrders, unlocked]);

  async function unlockKitchen() {
    if (!pin.trim() || isUnlocking) return;
    setIsUnlocking(true);
    try {
      if (isSupabaseConfigured()) {
        await verifyKitchenPinAction(pin.trim());
      } else if (pin !== settings.kitchenPin) {
        throw new Error("Invalid kitchen PIN.");
      }

      setUnlocked(true);
      toast.success("Kitchen unlocked.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not unlock kitchen.");
    } finally {
      setIsUnlocking(false);
    }
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      toast.error("Browser notifications are not supported.");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationEnabled(permission === "granted");
    toast.success(permission === "granted" ? "Notifications enabled." : "Notifications not enabled.");
  }

  if (!unlocked) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg items-center px-4 py-12">
        <div className="mesh-panel w-full rounded-card p-7 sm:p-8">
          <div className="grid size-14 place-items-center rounded-button bg-ember text-white shadow-[0_14px_36px_rgba(255,107,44,0.22)]">
            <LockKeyhole />
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white light:text-black">Kitchen access</h1>
          <p className="mt-3 leading-7 text-white/56 light:text-black/56">
            Enter the owner-generated kitchen PIN. Demo PIN: <strong>123456</strong>.
          </p>
          <input
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void unlockKitchen();
            }}
            className="input-surface mt-6 w-full rounded-button px-4 py-4 text-lg tracking-[0.28em] text-white outline-none light:text-black"
            placeholder="123456"
            aria-label="Kitchen PIN"
          />
          <button
            type="button"
            onClick={() => void unlockKitchen()}
            disabled={isUnlocking}
            className="pressable mt-4 w-full rounded-button bg-ember px-5 py-4 font-semibold text-white shadow-[0_16px_40px_rgba(255,107,44,0.24)]"
          >
            {isUnlocking ? "Checking..." : "Enter Kitchen"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-ember">Kitchen display</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white light:text-black">Active orders</h1>
          </div>
          <button
            type="button"
            onClick={enableNotifications}
            className="pressable inline-flex items-center justify-center gap-2 rounded-button border border-white/[0.09] bg-white/[0.065] px-4 py-3 font-semibold text-white light:bg-white/78 light:text-black"
          >
            {notificationEnabled ? <Volume2 size={18} /> : <Bell size={18} />}
            {notificationEnabled ? "Alerts On" : "Enable Alerts"}
          </button>
        </div>
        <p className="mt-3 text-sm text-white/45 light:text-black/45">
          {syncError ??
            (isRefreshing
              ? "Syncing latest orders..."
              : isRealtimeConnected
                ? "Realtime connected."
                : "Realtime reconnecting...")}
        </p>

        {openRequests.length > 0 && (
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {openRequests.map((request) => (
              <div key={request.id} className="rounded-card border border-saffron/20 bg-saffron/[0.08] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-saffron">Staff call</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white light:text-black">
                  Table {request.tableNumber}: {statusLabel(request.type)}
                </h2>
                <button
                  type="button"
                  onClick={async () => {
                    if (busyRequestId === request.id) return;
                    setBusyRequestId(request.id);
                    try {
                      await resolveStaffRequestAction({ requestId: request.id, kitchenPin: pin });
                      await refreshRequests();
                      toast.success("Request resolved.");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not resolve request.");
                    } finally {
                      setBusyRequestId(null);
                    }
                  }}
                  disabled={busyRequestId === request.id}
                  className="pressable mt-4 rounded-button bg-white px-4 py-2 text-sm font-semibold text-black"
                >
                  {busyRequestId === request.id ? "Resolving..." : "Mark resolved"}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {isRefreshing && activeOrders.length === 0 ? (
            Array.from({ length: 2 }, (_, index) => (
              <div key={index} className="mesh-panel rounded-card p-5">
                <div className="h-8 w-32 animate-pulse rounded-full bg-white/[0.07] light:bg-black/[0.06]" />
                <div className="mt-4 h-14 w-56 animate-pulse rounded-full bg-white/[0.07] light:bg-black/[0.06]" />
                <div className="mt-6 space-y-3">
                  <div className="h-14 animate-pulse rounded-2xl bg-white/[0.06] light:bg-black/[0.05]" />
                  <div className="h-14 animate-pulse rounded-2xl bg-white/[0.06] light:bg-black/[0.05]" />
                </div>
              </div>
            ))
          ) : activeOrders.length === 0 ? (
            <div className="mesh-panel rounded-card p-10 text-center">
              <ChefHat className="mx-auto text-ember" size={42} />
              <h2 className="mt-4 text-2xl font-semibold">No active orders</h2>
              <p className="mt-2 text-white/52 light:text-black/52">New orders will appear here instantly.</p>
            </div>
          ) : (
            activeOrders.map((order) => (
              <article key={order.id} className="interactive-card mesh-panel rounded-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42 light:text-black/44">
                      {order.orderNumber}
                    </p>
                    <h2 className="mt-1 text-5xl font-semibold tracking-tight text-white light:text-black">
                      Table {order.tableNumber}
                    </h2>
                    <p className="mt-2 text-sm text-white/50 light:text-black/50">
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="mt-5 space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="surface-soft flex items-center justify-between rounded-2xl p-4 text-lg">
                      <span>
                        <strong>{item.quantity}x</strong> {item.itemName}
                      </span>
                      <span className="text-white/55 light:text-black/55">{currency(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
                {order.notes && (
                  <p className="mt-4 rounded-2xl border border-ember/20 bg-ember/[0.08] p-4 text-sm leading-6 text-orange-100 light:text-orange-700">
                    {order.notes}
                  </p>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    if (busyOrderId === order.id) return;
                    setBusyOrderId(order.id);
                    try {
                      await advanceOrderStatusAction({
                        orderId: order.id,
                        currentStatus: order.status,
                        kitchenPin: pin
                      });
                      await refreshOrders();
                      toast.success("Order status updated.");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not update status.");
                    } finally {
                      setBusyOrderId(null);
                    }
                  }}
                  disabled={busyOrderId === order.id}
                  className="pressable mt-5 w-full rounded-button bg-ember px-5 py-4 text-lg font-semibold text-white shadow-[0_16px_40px_rgba(255,107,44,0.22)]"
                >
                  {busyOrderId === order.id ? "Updating..." : "Move to next status"}
                </button>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
