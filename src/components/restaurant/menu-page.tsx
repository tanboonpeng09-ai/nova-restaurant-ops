"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { BellRing, CheckCircle2, Minus, Plus, ReceiptText, ShoppingBag, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createOrderAction, createStaffRequestAction } from "@/actions/order-actions";
import { useRestaurantRealtime } from "@/hooks/use-restaurant-realtime";
import { useRestaurantStore } from "@/store/restaurant-store";
import {
  buildCartFingerprint,
  isDuplicateSubmission,
  shouldSuppressStaffRequest
} from "@/lib/reliability";
import { currency } from "@/lib/utils";
import type { RestaurantSnapshot } from "@/services/restaurant-service";
import type { StaffRequestType } from "@/types";

const submitCooldownMs = 8_000;

export function MenuPage({ initialSnapshot }: { initialSnapshot: RestaurantSnapshot }) {
  const searchParams = useSearchParams();
  const initialTable = searchParams.get("table") ?? "1";
  const [activeCategory, setActiveCategory] = useState("");
  const [tableNumber, setTableNumber] = useState(initialTable);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestingType, setRequestingType] = useState<StaffRequestType | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const lastSubmissionRef = useRef<{ key: string | null; time: number }>({ key: null, time: 0 });
  const lastStaffRequestRef = useRef<{ key: string | null; time: number }>({ key: null, time: 0 });
  const { snapshot, refreshAll, isRefreshing, syncError } = useRestaurantRealtime(initialSnapshot);
  const { settings, categories, menuItems, orders, staffRequests } = snapshot;
  const { cart, addToCart, setCartQuantity, clearCart, lastOrderId, setLastOrderId } =
    useRestaurantStore();

  const selectedCategory = activeCategory || categories[0]?.id || "";
  const visibleItems = useMemo(
    () => menuItems.filter((item) => item.categoryId === selectedCategory),
    [menuItems, selectedCategory]
  );
  const subtotal = cart.reduce((total, item) => total + item.menuItem.price * item.quantity, 0);
  const trackOrderId = confirmedOrderId ?? lastOrderId;
  const lastOrder = orders.find((order) => order.id === trackOrderId);

  async function submitOrder() {
    if (isSubmitting) {
      toast.info("Order is already being sent.");
      return;
    }
    if (!settings.orderingEnabled) {
      toast.error("Ordering is currently closed.");
      return;
    }
    if (!tableNumber.trim()) {
      toast.error("Enter a table number before placing the order.");
      return;
    }
    if (cart.length === 0) {
      toast.error("Add at least one item to the cart.");
      return;
    }

    const cleanTableNumber = tableNumber.trim();
    const cleanNotes = notes.trim();
    const submissionKey = `${cleanTableNumber}:${cleanNotes}:${buildCartFingerprint(
      cart.map((item) => ({
        id: item.menuItem.id,
        quantity: item.quantity,
        price: item.menuItem.price
      }))
    )}`;
    const submittedAt = Date.now();

    if (
      isDuplicateSubmission({
        previousKey: lastSubmissionRef.current.key,
        nextKey: submissionKey,
        previousTime: lastSubmissionRef.current.time,
        nextTime: submittedAt,
        cooldownMs: submitCooldownMs
      })
    ) {
      toast.info("That order was already submitted. Check the tracking link below.");
      return;
    }

    lastSubmissionRef.current = { key: submissionKey, time: submittedAt };
    setIsSubmitting(true);
    try {
      const orderId = await createOrderAction({ tableNumber: cleanTableNumber, notes: cleanNotes, cart });
      setLastOrderId(orderId);
      setConfirmedOrderId(orderId);
      clearCart();
      setNotes("");
      await refreshAll();
      toast.success("Order sent to kitchen.");
    } catch (error) {
      lastSubmissionRef.current = { key: null, time: 0 };
      toast.error(error instanceof Error ? error.message : "Could not place order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestStaff(type: StaffRequestType) {
    if (!tableNumber.trim()) {
      toast.error("Enter your table number first.");
      return;
    }
    if (requestingType) {
      toast.info("Sending your previous request first.");
      return;
    }

    const cleanTableNumber = tableNumber.trim();
    const requestKey = `${cleanTableNumber}:${type}`;
    const requestedAt = Date.now();

    if (
      shouldSuppressStaffRequest({
        existing: staffRequests,
        tableNumber: cleanTableNumber,
        type
      })
    ) {
      toast.info("That request is already open for your table.");
      return;
    }

    if (
      isDuplicateSubmission({
        previousKey: lastStaffRequestRef.current.key,
        nextKey: requestKey,
        previousTime: lastStaffRequestRef.current.time,
        nextTime: requestedAt,
        cooldownMs: submitCooldownMs
      })
    ) {
      toast.info("That request was already sent.");
      return;
    }

    lastStaffRequestRef.current = { key: requestKey, time: requestedAt };
    setRequestingType(type);
    try {
      await createStaffRequestAction({ tableNumber: cleanTableNumber, type });
      await refreshAll();
      toast.success(
        type === "bill"
          ? "Bill request sent."
          : type === "water"
            ? "Water request sent."
            : "Assistance request sent."
      );
    } catch (error) {
      lastStaffRequestRef.current = { key: null, time: 0 };
      toast.error(error instanceof Error ? error.message : "Could not send request.");
    } finally {
      setRequestingType(null);
    }
  }

  if (!settings.orderingEnabled) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center px-4 py-16 text-center">
        <div className="mesh-panel rounded-card p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-ember">Closed</p>
          <h1 className="mt-4 text-4xl font-semibold text-white light:text-black">Ordering is paused</h1>
          <p className="mt-4 text-white/65 light:text-black/65">{settings.closedMessage}</p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-button bg-ember px-5 py-3 font-semibold text-white"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_360px] lg:gap-8">
      <section>
        <div className="mesh-panel overflow-hidden rounded-card">
          <div className="relative h-56 sm:h-64">
            <Image
              src={settings.heroImage}
              alt={`${settings.name} dining room`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-saffron">
                Table {tableNumber || "?"}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{settings.name}</h1>
              <p className="mt-2 text-sm text-white/68 sm:text-base">{settings.tagline}</p>
            </div>
          </div>
        </div>

        <div className="sticky top-16 z-20 mt-4 flex gap-2 overflow-x-auto rounded-card border border-white/[0.08] bg-ink/[0.82] p-1.5 backdrop-blur-xl light:border-black/[0.07] light:bg-cream/[0.88]">
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`pressable whitespace-nowrap rounded-button px-4 py-2.5 text-sm font-semibold ${
                selectedCategory === category.id
                  ? "bg-ember text-white shadow-[0_10px_26px_rgba(255,107,44,0.18)]"
                  : "text-white/62 hover:bg-white/[0.07] light:text-black/62 light:hover:bg-black/[0.045]"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {isRefreshing && visibleItems.length === 0 ? (
            Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="mesh-panel rounded-card p-5">
                <div className="h-44 animate-pulse rounded-2xl bg-white/[0.06] light:bg-black/[0.05]" />
                <div className="mt-5 h-5 w-2/3 animate-pulse rounded-full bg-white/[0.07] light:bg-black/[0.06]" />
                <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-white/[0.05] light:bg-black/[0.05]" />
                <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-white/[0.05] light:bg-black/[0.05]" />
              </div>
            ))
          ) : visibleItems.length === 0 ? (
            <div className="mesh-panel rounded-card p-8 text-center text-white/55 light:text-black/55 md:col-span-2">
              No available items in this category right now.
            </div>
          ) : visibleItems.map((item) => (
            <article key={item.id} className="interactive-card mesh-panel overflow-hidden rounded-card">
              <div className="relative h-48 sm:h-52">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                {!item.isAvailable && (
                  <div className="absolute inset-0 grid place-items-center bg-black/70">
                    <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black">
                      Sold out today
                    </span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-white light:text-black">{item.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-white/52 light:text-black/54">
                      {item.description}
                    </p>
                  </div>
                  <p className="rounded-full bg-saffron/10 px-3 py-1 text-sm font-semibold text-saffron ring-1 ring-saffron/15">
                    {currency(item.price)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!item.isAvailable}
                  onClick={() => {
                    addToCart(item);
                    toast.success(`${item.name} added.`);
                  }}
                  className="pressable mt-5 inline-flex w-full items-center justify-center gap-2 rounded-button bg-white px-4 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-45 light:bg-black light:text-white"
                >
                  <Plus size={18} /> Add to cart
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="mesh-panel rounded-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ember">Cart</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white light:text-black">Your order</h2>
            </div>
            <ShoppingBag className="text-saffron" />
          </div>
          <label className="mt-5 block text-sm font-semibold text-white/70 light:text-black/70">
            Table number
            <input
              value={tableNumber}
              onChange={(event) => setTableNumber(event.target.value)}
              className="input-surface mt-2 w-full rounded-button px-4 py-3 text-white outline-none light:text-black"
            />
          </label>
          <div className="mt-5 space-y-3">
            {cart.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.12] p-5 text-sm leading-6 text-white/50 light:border-black/[0.09] light:text-black/52">
                Add a steak, cocktail, or side to start.
              </div>
            ) : (
              cart.map((cartItem) => (
                <div key={cartItem.menuItem.id} className="surface-soft rounded-2xl p-4">
                  <div className="flex justify-between gap-3">
                    <p className="font-semibold text-white light:text-black">{cartItem.menuItem.name}</p>
                    <p className="text-sm text-white/60 light:text-black/60">
                      {currency(cartItem.menuItem.price * cartItem.quantity)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCartQuantity(cartItem.menuItem.id, cartItem.quantity - 1)}
                      className="pressable grid size-9 place-items-center rounded-full bg-white/[0.08] hover:bg-white/[0.12] light:bg-black/[0.07] light:hover:bg-black/[0.1]"
                      aria-label={`Decrease ${cartItem.menuItem.name}`}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-semibold">{cartItem.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setCartQuantity(cartItem.menuItem.id, cartItem.quantity + 1)}
                      className="pressable grid size-9 place-items-center rounded-full bg-white/[0.08] hover:bg-white/[0.12] light:bg-black/[0.07] light:hover:bg-black/[0.1]"
                      aria-label={`Increase ${cartItem.menuItem.name}`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes for the kitchen"
            className="input-surface mt-5 min-h-24 w-full rounded-button px-4 py-3 text-white outline-none placeholder:text-white/35 light:text-black light:placeholder:text-black/35"
          />
          <div className="fine-divider mt-5 flex items-center justify-between border-t pt-5">
            <span className="text-sm text-white/56 light:text-black/56">Order Value</span>
            <span className="text-2xl font-semibold text-white light:text-black">{currency(subtotal)}</span>
          </div>
          <button
            type="button"
            onClick={submitOrder}
            disabled={isSubmitting || cart.length === 0}
            className="pressable mt-5 inline-flex w-full items-center justify-center gap-2 rounded-button bg-ember px-5 py-4 font-semibold text-white shadow-[0_16px_40px_rgba(255,107,44,0.24)]"
          >
            <ReceiptText size={18} /> {isSubmitting ? "Sending..." : "Place Order"}
          </button>
          {trackOrderId && (
            <Link
              href={`/track/${trackOrderId}`}
              className="pressable mt-3 inline-flex w-full items-center justify-center gap-2 rounded-button border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 text-sm font-semibold text-emerald-100 light:text-emerald-700"
            >
              <CheckCircle2 size={17} /> Track {lastOrder?.orderNumber ?? "latest order"}
            </Link>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ["bill", "Bill"],
            ["water", "Water"],
            ["assistance", "Help"]
          ].map(([type, label]) => (
            <button
              type="button"
              key={type}
              onClick={() => requestStaff(type as StaffRequestType)}
              disabled={requestingType !== null}
              className="pressable rounded-button border border-white/[0.09] bg-white/[0.065] px-3 py-3 text-sm font-semibold text-white hover:bg-white/[0.09] light:bg-white/78 light:text-black"
            >
              <BellRing className="mx-auto mb-1" size={16} />
              {requestingType === type ? "Sending" : label}
            </button>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-white/45 light:text-black/45">
          <Sparkles size={14} /> {syncError ?? (isRefreshing ? "Syncing latest data..." : "Orders sync to the kitchen in real time.")}
        </p>
      </aside>
    </div>
  );
}
