"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  ChefHat,
  CheckCircle2,
  Clock3,
  Flame,
  LockKeyhole,
  ReceiptText,
  TimerReset,
  Volume2,
  Wifi,
  WifiOff
} from "lucide-react";
import { toast } from "sonner";
import {
  advanceOrderStatusAction,
  resolveStaffRequestAction,
  verifyKitchenPinAction
} from "@/actions/order-actions";
import { restaurantConfig } from "@/config/restaurant";
import { useRestaurantRealtime } from "@/hooks/use-restaurant-realtime";
import { isSupabaseConfigured } from "@/lib/env";
import { getGenuinelyNewOrderIds } from "@/lib/kitchen-order-alerts";
import { currency, statusLabel } from "@/lib/utils";
import type { RestaurantSnapshot } from "@/services/restaurant-service";
import type { OrderStatus } from "@/types";

const statusStyles: Record<OrderStatus, string> = {
  new: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  preparing: "bg-amber-50 text-amber-700 ring-amber-200",
  ready: "bg-sky-50 text-sky-700 ring-sky-200",
  completed: "bg-slate-100 text-slate-500 ring-slate-200"
};

const statusAccent: Record<OrderStatus, string> = {
  new: "bg-emerald-500",
  preparing: "bg-amber-500",
  ready: "bg-sky-500",
  completed: "bg-slate-400"
};

const nextActionLabel: Record<OrderStatus, string> = {
  new: "Start preparing",
  preparing: "Mark ready",
  ready: "Complete order",
  completed: "Completed"
};

const kitchenLanes: Array<{
  status: Exclude<OrderStatus, "completed">;
  title: string;
  empty: string;
}> = [
  {
    status: "new",
    title: "New",
    empty: "No new orders."
  },
  {
    status: "preparing",
    title: "Preparing",
    empty: "Nothing is being prepared."
  },
  {
    status: "ready",
    title: "Ready",
    empty: "No orders ready for pickup."
  }
];

function orderCreatedTime(createdAt: string) {
  const date = new Date(createdAt);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });
}

function playKitchenAlertSound(audioContext: AudioContext, delay = 0) {
  const startedAt = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, startedAt);
  oscillator.frequency.exponentialRampToValueAtTime(660, startedAt + 0.16);
  gain.gain.setValueAtTime(0.0001, startedAt);
  gain.gain.exponentialRampToValueAtTime(0.12, startedAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.2);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startedAt);
  oscillator.stop(startedAt + 0.21);
}

function getAudioContextConstructor() {
  return window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

export function KitchenDashboard({ initialSnapshot }: { initialSnapshot: RestaurantSnapshot }) {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [isAlertActivationPending, setIsAlertActivationPending] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alertsEnabledRef = useRef(false);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
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
  const ordersByStatus = useMemo(
    () =>
      kitchenLanes.map((lane) => ({
        ...lane,
        orders: activeOrders.filter((order) => order.status === lane.status)
      })),
    [activeOrders]
  );
  const openRequests = staffRequests.filter((request) => request.status === "open");

  useEffect(() => {
    if (unlocked && activeOrders[0]) {
      document.title = `${activeOrders.length} active orders - Kitchen`;
    }
  }, [activeOrders, unlocked]);

  useEffect(() => {
    const newOrderIds = getGenuinelyNewOrderIds(orders, knownOrderIdsRef.current);
    orders.forEach((order) => knownOrderIdsRef.current.add(order.id));

    if (!alertsEnabled || newOrderIds.length === 0) return;

    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    void audioContext
      .resume()
      .then(() => {
        if (!alertsEnabledRef.current) return;
        newOrderIds.forEach((_, index) => playKitchenAlertSound(audioContext, index * 0.26));
      })
      .catch(() => {
        alertsEnabledRef.current = false;
        setAlertsEnabled(false);
        toast.error("Audio alerts are unavailable. Check browser sound settings and enable them again.");
      });
  }, [alertsEnabled, orders]);

  useEffect(() => {
    return () => {
      const audioContext = audioContextRef.current;
      if (audioContext && audioContext.state !== "closed") {
        void audioContext.close();
      }
    };
  }, []);

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

  async function toggleAudioAlerts() {
    if (isAlertActivationPending) return;

    if (alertsEnabled) {
      alertsEnabledRef.current = false;
      setAlertsEnabled(false);
      try {
        await audioContextRef.current?.suspend();
      } catch {
        // The visual toggle still disables alerts even if the browser cannot suspend its context.
      }
      toast.success("Audio alerts disabled.");
      return;
    }

    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) {
      toast.error("Audio alerts are not supported by this browser.");
      return;
    }

    setIsAlertActivationPending(true);
    try {
      const audioContext = audioContextRef.current ?? new AudioContextConstructor();
      audioContextRef.current = audioContext;
      await audioContext.resume();
      playKitchenAlertSound(audioContext);

      // Existing orders are the activation baseline and must never announce after a refresh.
      knownOrderIdsRef.current = new Set(orders.map((order) => order.id));
      alertsEnabledRef.current = true;
      setAlertsEnabled(true);
      toast.success("Audio alerts enabled.");
    } catch {
      alertsEnabledRef.current = false;
      setAlertsEnabled(false);
      toast.error("Could not enable audio alerts. Check browser sound settings and try again.");
    } finally {
      setIsAlertActivationPending(false);
    }
  }

  if (!unlocked) {
    const kitchenAccess = restaurantConfig.kitchenAccess;

    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#f6f8fb] px-4 py-12 text-slate-950">
        <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-lg items-center">
          <div className="w-full rounded-[24px] border border-slate-200 bg-white p-7 shadow-[0_18px_54px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="grid size-14 place-items-center rounded-[18px] bg-slate-950 text-white shadow-[0_14px_36px_rgba(15,23,42,0.18)]">
              <LockKeyhole />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              {kitchenAccess.eyebrow}
            </p>
            <h1 className="mt-2 text-[34px] font-bold tracking-[-0.05em] text-slate-950">{kitchenAccess.title}</h1>
            <p className="mt-3 leading-7 text-slate-500">
              {kitchenAccess.pinHelpText}
            </p>
            <input
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void unlockKitchen();
              }}
              className="mt-6 h-14 w-full rounded-button border border-slate-200 bg-slate-50 px-4 text-lg font-bold tracking-[0.28em] text-slate-950 outline-none transition duration-200 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              placeholder={kitchenAccess.pinPlaceholder}
              aria-label="Kitchen PIN"
            />
            <button
              type="button"
              onClick={() => void unlockKitchen()}
              disabled={isUnlocking}
              className="pressable mt-4 inline-flex min-h-14 w-full items-center justify-center rounded-button bg-emerald-500 px-5 py-4 font-bold text-white shadow-[0_18px_44px_rgba(16,185,129,0.24)] hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {isUnlocking ? kitchenAccess.checkingLabel : kitchenAccess.submitLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f6f8fb] px-4 py-5 text-slate-950 sm:px-6 lg:py-6">
      <div className="mx-auto max-w-[1500px]">
        <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-[18px] bg-slate-950 text-white">
                <ChefHat size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Kitchen Display
                </p>
                <h1 className="mt-1 truncate text-[34px] font-bold tracking-[-0.05em] text-slate-950">
                  Active orders
                </h1>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
                {isRealtimeConnected ? (
                  <Wifi size={16} className="text-emerald-500" />
                ) : (
                  <WifiOff size={16} className="text-amber-500" />
                )}
                {syncError ?? (isRefreshing ? "Syncing orders..." : isRealtimeConnected ? "Live sync on" : "Reconnecting")}
              </div>
              <button
                type="button"
                onClick={() => void toggleAudioAlerts()}
                disabled={isAlertActivationPending}
                aria-pressed={alertsEnabled}
                aria-label={alertsEnabled ? "Disable audio alerts" : "Enable audio alerts"}
                className="pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-button border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.04)] hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {alertsEnabled ? <Volume2 size={18} /> : <Bell size={18} />}
                {isAlertActivationPending ? "Enabling..." : alertsEnabled ? "Alerts On" : "Enable Alerts"}
              </button>
              <span className="sr-only" aria-live="polite">
                {alertsEnabled ? "Audio alerts are enabled." : "Audio alerts are disabled."}
              </span>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Active</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{activeOrders.length}</p>
            </div>
            <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Staff calls</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{openRequests.length}</p>
            </div>
            <div className="rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Mode</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">Service</p>
            </div>
          </div>
        </div>

        {openRequests.length > 0 && (
          <section className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50/80 p-3 shadow-[0_8px_22px_rgba(120,53,15,0.04)]">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="flex shrink-0 items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-amber-700">
                <Bell size={17} />
                Staff requests
                <span className="grid size-6 place-items-center rounded-full bg-amber-200 text-xs text-amber-900">
                  {openRequests.length}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 xl:pb-0">
              {openRequests.map((request) => (
                <div key={request.id} className="flex min-w-[260px] items-center justify-between gap-3 rounded-[14px] border border-amber-200 bg-white px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">
                      Table {request.tableNumber}: {statusLabel(request.type)}
                    </p>
                    <p className="text-xs font-semibold text-amber-700">Open staff call</p>
                  </div>
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
                    className="pressable inline-flex min-h-9 shrink-0 items-center justify-center rounded-full bg-amber-100 px-3 text-xs font-black text-amber-800 hover:bg-amber-200 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {busyRequestId === request.id ? "Resolving..." : "Mark resolved"}
                  </button>
                </div>
              ))}
              </div>
            </div>
          </section>
        )}

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ordersByStatus.map((lane) => (
            <section
              key={lane.status}
              className="min-w-0 rounded-[24px] border border-slate-200 bg-slate-100/70 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.035)]"
            >
              <div className="flex items-center justify-between gap-3 px-1 pb-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`h-3 w-3 shrink-0 rounded-full ${statusAccent[lane.status]}`} />
                  <h2 className="truncate text-lg font-black tracking-[-0.04em] text-slate-950">{lane.title}</h2>
                </div>
                <span className="grid size-8 place-items-center rounded-full bg-white text-sm font-black text-slate-700 ring-1 ring-slate-200">
                  {lane.orders.length}
                </span>
              </div>

              <div className="space-y-3">
                {isRefreshing && activeOrders.length === 0 ? (
                  <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
                    <div className="h-7 w-32 animate-pulse rounded-full bg-slate-100" />
                    <div className="mt-4 h-12 w-48 animate-pulse rounded-full bg-slate-100" />
                    <div className="mt-5 space-y-2">
                      <div className="h-14 animate-pulse rounded-[14px] bg-slate-100" />
                      <div className="h-14 animate-pulse rounded-[14px] bg-slate-100" />
                    </div>
                  </div>
                ) : lane.orders.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-slate-300 bg-white/70 p-6 text-center">
                    <ChefHat className="mx-auto text-slate-300" size={30} />
                    <p className="mt-3 text-sm font-bold text-slate-500">{lane.empty}</p>
                  </div>
                ) : (
                  lane.orders.map((order) => (
                    <article
                      key={order.id}
                      className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_8px_22px_rgba(15,23,42,0.055)]"
                    >
                      <div className={`h-1.5 ${statusAccent[order.status]}`} />
                      <div className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                              <ReceiptText size={14} />
                              {order.orderNumber}
                            </p>
                            <h3 className="mt-2 text-[38px] font-black leading-none tracking-[-0.06em] text-slate-950">
                              Table {order.tableNumber}
                            </h3>
                          </div>
                          <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] ring-1 ${statusStyles[order.status]}`}>
                            {statusLabel(order.status)}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                              <Clock3 size={13} /> Time
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800">{orderCreatedTime(order.createdAt)}</p>
                          </div>
                          <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                              <TimerReset size={13} /> Elapsed
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 rounded-[14px] border border-slate-200 bg-white p-3 shadow-[0_3px_10px_rgba(15,23,42,0.025)]">
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-slate-950 text-base font-black text-white">
                                  {item.quantity}x
                                </span>
                                <span className="min-w-0 text-base font-bold leading-6 text-slate-950">{item.itemName}</span>
                              </div>
                              <span className="shrink-0 text-sm font-bold tabular-nums text-slate-500">{currency(item.lineTotal)}</span>
                            </div>
                          ))}
                        </div>
                        {order.notes && (
                          <div className="mt-4 rounded-[16px] border border-amber-200 bg-amber-50 p-4">
                            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-amber-700">
                              <Flame size={14} /> Kitchen notes
                            </p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">{order.notes}</p>
                          </div>
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
                          className="pressable mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-button bg-emerald-500 px-5 py-3.5 text-base font-bold text-white shadow-[0_16px_36px_rgba(16,185,129,0.22)] hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                        >
                          <CheckCircle2 size={19} />
                          {busyOrderId === order.id ? "Updating..." : nextActionLabel[order.status]}
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
