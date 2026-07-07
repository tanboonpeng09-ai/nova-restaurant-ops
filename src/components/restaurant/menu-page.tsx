"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { UserRound, Utensils } from "lucide-react";
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
import { getCartItemQuantity } from "@/lib/cart-quantity";
import type { RestaurantSnapshot } from "@/services/restaurant-service";
import type { MenuItem, StaffRequestType } from "@/types";

const submitCooldownMs = 8_000;
const menuToastOptions = { position: "bottom-center" as const };
const addToCartToastId = "menu-add-to-cart";

export function MenuPage({ initialSnapshot }: { initialSnapshot: RestaurantSnapshot }) {
  const searchParams = useSearchParams();
  const initialTable = searchParams.get("table") ?? "1";
  const [activeCategory, setActiveCategory] = useState("");
  const [tableNumber, setTableNumber] = useState(initialTable);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestingType, setRequestingType] = useState<StaffRequestType | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [isReviewingOrder, setIsReviewingOrder] = useState(false);
  const lastSubmissionRef = useRef<{ key: string | null; time: number }>({ key: null, time: 0 });
  const lastStaffRequestRef = useRef<{ key: string | null; time: number }>({ key: null, time: 0 });
  const { snapshot, refreshAll, isRefreshing, syncError } = useRestaurantRealtime(initialSnapshot);
  const { settings, categories, menuItems, orders, staffRequests } = snapshot;
  const { cart, addToCart, removeFromCart, setCartQuantity, clearCart, lastOrderId, setLastOrderId } =
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

  useEffect(() => {
    function syncReviewStateFromHash() {
      setIsReviewingOrder(window.location.hash === "#order-panel");
    }

    syncReviewStateFromHash();
    window.addEventListener("hashchange", syncReviewStateFromHash);
    return () => window.removeEventListener("hashchange", syncReviewStateFromHash);
  }, []);

  function openOrderReview() {
    setIsReviewingOrder(true);
    window.history.replaceState(null, "", "#order-panel");
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  }

  function closeOrderReview() {
    setIsReviewingOrder(false);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    window.setTimeout(() => {
      document.getElementById("menu-list")?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 0);
  }

  async function submitOrder() {
    if (isSubmitting) {
      toast.info("Order is already being sent.", menuToastOptions);
      return;
    }
    if (!settings.orderingEnabled) {
      toast.error("Ordering is currently closed.", menuToastOptions);
      return;
    }
    if (!tableNumber.trim()) {
      toast.error("Enter a table number before placing the order.", menuToastOptions);
      return;
    }
    if (cart.length === 0) {
      toast.error("Add at least one item to the cart.", menuToastOptions);
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
      toast.info("That order was already submitted. Check the tracking link below.", menuToastOptions);
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
      toast.success("Order sent to kitchen.", menuToastOptions);
    } catch (error) {
      lastSubmissionRef.current = { key: null, time: 0 };
      toast.error(error instanceof Error ? error.message : "Could not place order.", menuToastOptions);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestStaff(type: StaffRequestType) {
    if (!tableNumber.trim()) {
      toast.error("Enter your table number first.", menuToastOptions);
      return;
    }
    if (requestingType) {
      toast.info("Sending your previous request first.", menuToastOptions);
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
      toast.info("That request is already open for your table.", menuToastOptions);
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
      toast.info("That request was already sent.", menuToastOptions);
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
            : "Assistance request sent.",
        menuToastOptions
      );
    } catch (error) {
      lastStaffRequestRef.current = { key: null, time: 0 };
      toast.error(error instanceof Error ? error.message : "Could not send request.", menuToastOptions);
    } finally {
      setRequestingType(null);
    }
  }

  function handleAddToCart(item: MenuItem) {
    addToCart(item);
    toast.success(`${item.name} added.`, {
      ...menuToastOptions,
      id: addToCartToastId
    });
  }

  function handleDecreaseCartQuantity(item: MenuItem, quantity: number) {
    if (quantity <= 1) {
      removeFromCart(item.id);
      return;
    }

    setCartQuantity(item.id, quantity - 1);
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
      className={`mx-auto grid min-h-[calc(100vh-4rem)] max-w-none gap-6 overflow-x-hidden bg-[#f4f6f8] px-4 py-0 text-slate-950 sm:px-6 lg:min-h-screen lg:grid-cols-[204px_minmax(0,1fr)_324px] lg:gap-0 lg:overflow-hidden lg:bg-[#f6f8fb] lg:p-0 ${
        cart.length > 0 && !isReviewingOrder ? "pb-52 lg:pb-0" : "pb-8 lg:pb-0"
      }`}
    >
      <div className="hidden h-14 items-center justify-between border-b border-slate-200 bg-white px-7 lg:col-span-3 lg:flex">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-8 place-items-center rounded-xl bg-slate-950 text-white">
            <Utensils size={16} />
          </span>
          <p className="truncate text-lg font-bold tracking-[-0.03em] text-slate-950">{settings.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
            Table {tableNumber || "?"}
          </span>
          <span className="grid size-8 place-items-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200">
            <UserRound size={15} />
          </span>
        </div>
      </div>

      <aside className="hidden border-r border-slate-200 bg-white px-4 py-5 lg:block">
        <h2 className="text-lg font-bold tracking-[-0.04em] text-slate-950">Categories</h2>
        <div className="mt-5 space-y-1.5">
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`pressable relative flex min-h-11 w-full items-center gap-3 rounded-[12px] px-3.5 text-left text-sm font-bold transition duration-200 ${
                selectedCategory === category.id
                  ? "bg-emerald-50 text-emerald-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <Utensils size={17} />
              <span className="truncate">{category.name}</span>
              {selectedCategory === category.id && (
                <span className="absolute right-0 top-2 h-9 w-1 rounded-full bg-emerald-500" />
              )}
            </button>
          ))}
        </div>
      </aside>

      <section
        className={`min-w-0 lg:block lg:w-full lg:max-w-[760px] lg:px-4 lg:py-4 xl:px-5 ${
          isReviewingOrder ? "hidden" : "block"
        }`}
      >
        <MobileMenuHeader settings={settings} tableNumber={tableNumber} />

        <CategoryNavigation
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setActiveCategory}
        />

        <FeaturedSection
          items={featuredItems}
          getItemQuantity={(itemId) => getCartItemQuantity(cart, itemId)}
          onAddToCart={handleAddToCart}
          onDecreaseQuantity={handleDecreaseCartQuantity}
        />

        <div className="hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Menu</p>
          <div className="mt-1 flex items-end justify-between gap-5">
            <div>
              <h1 className="text-[26px] font-bold tracking-[-0.05em] text-slate-950">
                {categories.find((category) => category.id === selectedCategory)?.name ?? "Menu"}
              </h1>
              <p className="mt-1 text-[13px] font-medium text-slate-500">
                Browse table-ready dishes and send orders directly to the kitchen.
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-slate-500">
              {visibleItems.length} {visibleItems.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-4 lg:hidden">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Browse
            </p>
            <h2 className="mt-0.5 text-[22px] font-bold tracking-[-0.04em] text-slate-950">
              {categories.find((category) => category.id === selectedCategory)?.name ?? "Menu"}
            </h2>
          </div>
          <p className="text-sm font-semibold text-slate-500">
            {visibleItems.length} {visibleItems.length === 1 ? "item" : "items"}
          </p>
        </div>

        <div
          id="menu-list"
          className="mt-3 grid gap-3 lg:mt-4 lg:[grid-template-columns:repeat(2,minmax(0,232px))] lg:gap-3 xl:[grid-template-columns:repeat(3,minmax(0,232px))]"
        >
          {isRefreshing && visibleItems.length === 0 ? (
            Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="rounded-[16px] bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.055)] ring-1 ring-slate-200/80">
                <div className="h-[92px] animate-pulse rounded-[12px] bg-slate-100 lg:aspect-[4/3] lg:h-auto" />
                <div className="mt-4 h-5 w-2/3 animate-pulse rounded-full bg-slate-100" />
                <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-slate-100" />
                <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
              </div>
            ))
          ) : visibleItems.length === 0 ? (
            <div className="rounded-[18px] bg-white p-8 text-center text-slate-500 shadow-[0_8px_22px_rgba(15,23,42,0.055)] ring-1 ring-slate-200/80 lg:col-span-full">
              No available items in this category right now.
            </div>
          ) : visibleItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              quantity={getCartItemQuantity(cart, item.id)}
              onAddToCart={handleAddToCart}
              onDecreaseQuantity={handleDecreaseCartQuantity}
            />
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
        isMobileReviewOpen={isReviewingOrder}
        onCloseMobileReview={closeOrderReview}
      />
      {!isReviewingOrder && (
        <StickyCartBar
          itemCount={itemCount}
          subtotal={subtotal}
          onReviewOrder={openOrderReview}
        />
      )}
    </div>
  );
}
