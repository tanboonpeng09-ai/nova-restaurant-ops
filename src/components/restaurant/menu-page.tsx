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
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 lg:py-8">
      <section>
        <div className="overflow-hidden rounded-card border border-white/[0.08] bg-white/[0.04] shadow-[0_18px_58px_rgba(0,0,0,0.22)] light:border-black/[0.07] light:bg-white/80 light:shadow-[0_18px_48px_rgba(40,28,18,0.1)]">
          <div className="relative h-52 sm:h-64 lg:h-72">
            <Image
              src={settings.heroImage}
              alt={`${settings.name} dining room`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/28 to-black/5" />
            <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-saffron drop-shadow">
                Table {tableNumber || "?"}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-5xl">{settings.name}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/72 sm:text-base">{settings.tagline}</p>
            </div>
          </div>
        </div>

        <div className="sticky top-16 z-20 mt-4 flex gap-2 overflow-x-auto rounded-[22px] border border-white/[0.08] bg-ink/[0.9] p-1.5 shadow-[0_14px_38px_rgba(0,0,0,0.18)] backdrop-blur-xl scrollbar-none light:border-black/[0.07] light:bg-cream/[0.92]">
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`pressable min-h-11 whitespace-nowrap rounded-button px-5 py-2.5 text-sm font-semibold ${
                selectedCategory === category.id
                  ? "bg-ember text-white shadow-[0_10px_26px_rgba(255,107,44,0.2)]"
                  : "text-white/62 hover:bg-white/[0.07] light:text-black/62 light:hover:bg-black/[0.045]"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {isRefreshing && visibleItems.length === 0 ? (
            Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="rounded-card border border-white/[0.08] bg-white/[0.04] p-3 light:border-black/[0.07] light:bg-white/76">
                <div className="aspect-[4/3] animate-pulse rounded-[20px] bg-white/[0.06] light:bg-black/[0.05]" />
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
            <article
              key={item.id}
              className={`group overflow-hidden rounded-card border border-white/[0.08] bg-white/[0.045] p-3 shadow-[0_18px_54px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:border-white/[0.14] light:border-black/[0.07] light:bg-white/82 light:shadow-[0_18px_44px_rgba(40,28,18,0.1)] ${
                item.isAvailable ? "" : "opacity-78"
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-white/[0.04]">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className={`object-cover transition duration-500 group-hover:scale-[1.035] ${
                    item.isAvailable ? "" : "grayscale"
                  }`}
                />
                {!item.isAvailable && (
                  <div className="absolute inset-0 grid place-items-center bg-black/50">
                    <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-black shadow-soft">
                      Sold out today
                    </span>
                  </div>
                )}
              </div>
              <div className="px-2 pb-2 pt-5">
                <h2 className="text-xl font-semibold tracking-tight text-white light:text-black">{item.name}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-white/54 light:text-black/56">
                  {item.description}
                </p>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <p className="text-lg font-semibold text-white light:text-black">{currency(item.price)}</p>
                  <button
                    type="button"
                    disabled={!item.isAvailable}
                    onClick={() => {
                      addToCart(item);
                      toast.success(`${item.name} added.`);
                    }}
                    className="pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-[0_10px_26px_rgba(0,0,0,0.18)] disabled:cursor-not-allowed disabled:opacity-45 light:bg-black light:text-white"
                  >
                    <Plus size={17} /> {item.isAvailable ? "Add" : "Sold out"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-card border border-white/[0.08] bg-white/[0.05] p-5 shadow-[0_22px_64px_rgba(0,0,0,0.2)] backdrop-blur-xl light:border-black/[0.07] light:bg-white/84 light:shadow-[0_18px_48px_rgba(40,28,18,0.1)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ember">Cart</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white light:text-black">Your order</h2>
            </div>
            <span className="grid size-11 place-items-center rounded-button bg-saffron/10 text-saffron ring-1 ring-saffron/15">
              <ShoppingBag size={20} />
            </span>
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
              <div className="rounded-2xl border border-dashed border-white/[0.13] p-6 text-center light:border-black/[0.1]">
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-white/[0.06] text-saffron light:bg-black/[0.04]">
                  <ShoppingBag size={20} />
                </span>
                <p className="mt-4 font-semibold text-white light:text-black">Your cart is empty</p>
                <p className="mt-2 text-sm leading-6 text-white/50 light:text-black/52">
                  Add a steak, cocktail, or side to start your table order.
                </p>
              </div>
            ) : (
              cart.map((cartItem) => (
                <div key={cartItem.menuItem.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.055] p-4 light:border-black/[0.07] light:bg-black/[0.035]">
                  <div className="flex justify-between gap-3">
                    <p className="font-semibold text-white light:text-black">{cartItem.menuItem.name}</p>
                    <p className="text-sm font-semibold text-white/70 light:text-black/68">
                      {currency(cartItem.menuItem.price * cartItem.quantity)}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCartQuantity(cartItem.menuItem.id, cartItem.quantity - 1)}
                      className="pressable grid size-10 place-items-center rounded-full bg-white/[0.08] hover:bg-white/[0.12] light:bg-black/[0.07] light:hover:bg-black/[0.1]"
                      aria-label={`Decrease ${cartItem.menuItem.name}`}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-9 text-center font-semibold">{cartItem.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setCartQuantity(cartItem.menuItem.id, cartItem.quantity + 1)}
                      className="pressable grid size-10 place-items-center rounded-full bg-white/[0.08] hover:bg-white/[0.12] light:bg-black/[0.07] light:hover:bg-black/[0.1]"
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
          <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/18 p-4 light:border-black/[0.06] light:bg-black/[0.025]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/56 light:text-black/56">Order Value</span>
              <span className="text-2xl font-semibold text-white light:text-black">{currency(subtotal)}</span>
            </div>
            <p className="mt-2 text-xs text-white/38 light:text-black/42">Taxes and payment are handled by the restaurant.</p>
          </div>
          <button
            type="button"
            onClick={submitOrder}
            disabled={isSubmitting || cart.length === 0}
            className="pressable mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-button bg-ember px-5 py-4 font-semibold text-white shadow-[0_16px_40px_rgba(255,107,44,0.24)] hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(255,107,44,0.3)] disabled:cursor-not-allowed disabled:opacity-55"
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
              className="pressable min-h-[72px] rounded-button border border-white/[0.09] bg-white/[0.065] px-3 py-3 text-sm font-semibold text-white hover:bg-white/[0.09] light:bg-white/78 light:text-black"
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
