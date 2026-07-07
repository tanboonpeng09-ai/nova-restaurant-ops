"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Clock3, Star } from "lucide-react";
import { toast } from "sonner";
import { createOrderAction, createStaffRequestAction } from "@/actions/order-actions";
import { CartCommandCenter } from "@/components/menu/cart-command-center";
import { CategoryNavigation } from "@/components/menu/category-navigation";
import { FeaturedSection } from "@/components/menu/featured-section";
import { ItemCard } from "@/components/menu/item-card";
import { MobileMenuHeader } from "@/components/menu/mobile-menu-header";
import { StickyCartBar } from "@/components/menu/sticky-cart-bar";
import { useRestaurantRealtime } from "@/hooks/use-restaurant-realtime";
import { useRestaurantStore } from "@/store/restaurant-store";
import {
  buildCartFingerprint,
  isDuplicateSubmission,
  shouldSuppressStaffRequest
} from "@/lib/reliability";
import type { RestaurantSnapshot } from "@/services/restaurant-service";
import type { MenuItem, StaffRequestType } from "@/types";

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
  const featuredItems = useMemo(
    () => menuItems.filter((item) => item.isFeatured && item.isAvailable).slice(0, 4),
    [menuItems]
  );
  const subtotal = cart.reduce((total, item) => total + item.menuItem.price * item.quantity, 0);
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
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

  function handleAddToCart(item: MenuItem) {
    addToCart(item);
    toast.success(`${item.name} added.`);
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
    <div
      className={`mx-auto grid max-w-7xl gap-6 overflow-x-hidden px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 lg:py-8 ${
        cart.length > 0 ? "pb-28 lg:pb-8" : ""
      }`}
    >
      <section className="min-w-0">
        <MobileMenuHeader settings={settings} tableNumber={tableNumber} />

        <div className="relative hidden overflow-hidden rounded-card border border-white/[0.08] bg-white/[0.035] p-5 shadow-[0_18px_52px_rgba(0,0,0,0.16)] light:border-black/[0.06] light:bg-white/88 light:shadow-[0_16px_40px_rgba(40,28,18,0.08)] sm:p-6 lg:block lg:p-8">
          <Image
            src={settings.heroImage}
            alt={`${settings.name} dining room`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 70vw"
            className="object-cover object-center opacity-45 saturate-[0.9] light:opacity-32"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,9,8,0.96),rgba(10,9,8,0.78)_54%,rgba(10,9,8,0.42)),linear-gradient(0deg,rgba(10,9,8,0.72),rgba(10,9,8,0.2))] light:bg-[linear-gradient(90deg,rgba(255,250,244,0.96),rgba(255,250,244,0.82)_55%,rgba(255,250,244,0.58)),linear-gradient(0deg,rgba(255,250,244,0.76),rgba(255,250,244,0.32))]" />
          <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_260px] md:items-end lg:gap-8">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid size-12 place-items-center rounded-button bg-ember text-sm font-semibold tracking-[0.18em] text-white shadow-[0_14px_34px_rgb(var(--color-primary)_/_0.24)]">
                  NS
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-saffron">Premium American Grill</p>
                  <p className="mt-1 text-sm text-white/56 light:text-black/56">Modern table ordering</p>
                </div>
              </div>
              <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[0.95] tracking-tight text-white drop-shadow-[0_4px_22px_rgba(0,0,0,0.46)] light:text-black sm:text-5xl lg:text-[3.75rem]">
                {settings.name}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex h-10 items-center rounded-full bg-emerald-400/14 px-3.5 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-300/20 light:bg-emerald-500/10 light:text-emerald-700 light:ring-emerald-600/18">
                  Open now
                </span>
                <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/[0.075] px-3.5 text-xs font-semibold text-white/82 ring-1 ring-white/[0.08] light:bg-black/[0.04] light:text-black/62 light:ring-black/[0.055]">
                  <Star size={14} className="fill-saffron text-saffron" /> 4.9
                </span>
                <span className="inline-flex h-10 items-center gap-2 rounded-full bg-white/[0.075] px-3.5 text-xs font-semibold text-white/72 ring-1 ring-white/[0.08] light:bg-black/[0.04] light:text-black/58 light:ring-black/[0.055]">
                  <Clock3 size={15} /> 18-24 min
                </span>
              </div>
            </div>

            <div className="rounded-[20px] bg-black/28 p-4 ring-1 ring-white/[0.09] backdrop-blur-md light:bg-white/64 light:ring-black/[0.06]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42 light:text-black/44">Your table</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-white light:text-black">
                Table {tableNumber || "?"}
              </p>
              <a
                href="#menu-list"
                className="pressable mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-button bg-ember px-5 text-sm font-semibold text-white shadow-[0_16px_34px_rgb(var(--color-primary)_/_0.24)] transition duration-200 md:hover:-translate-y-0.5 md:hover:shadow-[0_20px_42px_rgb(var(--color-primary)_/_0.3)]"
              >
                Start order
              </a>
            </div>
          </div>
        </div>

        <FeaturedSection items={featuredItems} onAddToCart={handleAddToCart} />

        <CategoryNavigation
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setActiveCategory}
        />

        <div className="mt-5 flex items-end justify-between gap-4 lg:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/36 light:text-black/38">
              Browse
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white light:text-black">
              {categories.find((category) => category.id === selectedCategory)?.name ?? "Menu"}
            </h2>
          </div>
          <p className="text-sm font-medium text-white/45 light:text-black/45">
            {visibleItems.length} {visibleItems.length === 1 ? "item" : "items"}
          </p>
        </div>

        <div id="menu-list" className="mt-4 grid gap-3 md:mt-7 md:gap-5 md:grid-cols-2">
          {isRefreshing && visibleItems.length === 0 ? (
            Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="rounded-card bg-white/[0.045] p-3 light:bg-white/82">
                <div className="aspect-[4/3] animate-pulse rounded-button bg-white/[0.06] light:bg-black/[0.05]" />
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
            <ItemCard key={item.id} item={item} onAddToCart={handleAddToCart} />
          ))}
        </div>
      </section>

      <CartCommandCenter
        cart={cart}
        tableNumber={tableNumber}
        notes={notes}
        subtotal={subtotal}
        isSubmitting={isSubmitting}
        trackOrderId={trackOrderId}
        lastOrder={lastOrder}
        requestingType={requestingType}
        syncError={syncError}
        isRefreshing={isRefreshing}
        onTableNumberChange={setTableNumber}
        onNotesChange={setNotes}
        onSetCartQuantity={setCartQuantity}
        onSubmitOrder={submitOrder}
        onRequestStaff={requestStaff}
      />
      <StickyCartBar
        itemCount={itemCount}
        subtotal={subtotal}
        isSubmitting={isSubmitting}
        onSubmitOrder={submitOrder}
      />
    </div>
  );
}
