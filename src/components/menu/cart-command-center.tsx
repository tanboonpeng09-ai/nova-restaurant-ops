import Link from "next/link";
import { BellRing, CheckCircle2, Minus, Plus, ReceiptText, ShoppingBag, Sparkles } from "lucide-react";
import { currency } from "@/lib/utils";
import type { CartItem, Order, StaffRequestType } from "@/types";
import { EmptyCartState } from "@/components/menu/empty-cart-state";

export function CartCommandCenter({
  cart,
  tableNumber,
  notes,
  subtotal,
  isSubmitting,
  trackOrderId,
  lastOrder,
  requestingType,
  syncError,
  isRefreshing,
  onTableNumberChange,
  onNotesChange,
  onSetCartQuantity,
  onSubmitOrder,
  onRequestStaff
}: {
  cart: CartItem[];
  tableNumber: string;
  notes: string;
  subtotal: number;
  isSubmitting: boolean;
  trackOrderId: string | null;
  lastOrder?: Order;
  requestingType: StaffRequestType | null;
  syncError: string | null;
  isRefreshing: boolean;
  onTableNumberChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSetCartQuantity: (itemId: string, quantity: number) => void;
  onSubmitOrder: () => void;
  onRequestStaff: (type: StaffRequestType) => void;
}) {
  return (
    <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-card border border-white/[0.08] bg-white/[0.05] p-5 shadow-[0_22px_64px_rgba(0,0,0,0.2)] backdrop-blur-xl light:border-black/[0.07] light:bg-white/88 light:shadow-[0_18px_48px_rgba(40,28,18,0.1)]">
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
            onChange={(event) => onTableNumberChange(event.target.value)}
            className="mt-2 h-12 w-full rounded-button border border-transparent bg-white/[0.06] px-4 text-base font-medium text-white shadow-inner shadow-black/[0.04] outline-none ring-1 ring-white/[0.065] transition duration-200 placeholder:text-white/35 focus:bg-white/[0.08] focus:ring-saffron/35 light:bg-black/[0.035] light:text-black light:ring-black/[0.055] light:focus:bg-white light:focus:ring-ember/30"
          />
        </label>
        <div className="mt-5 space-y-3">
          {cart.length === 0 ? (
            <EmptyCartState />
          ) : (
            cart.map((cartItem) => (
              <div key={cartItem.menuItem.id} className="rounded-2xl bg-white/[0.052] p-4 ring-1 ring-white/[0.07] light:bg-black/[0.028] light:ring-black/[0.055]">
                <div className="flex items-start justify-between gap-4">
                  <p className="min-w-0 text-[15px] font-semibold leading-5 text-white light:text-black">{cartItem.menuItem.name}</p>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-white/72 light:text-black/68">
                    {currency(cartItem.menuItem.price * cartItem.quantity)}
                  </p>
                </div>
                <div className="mt-4 inline-flex items-center rounded-full bg-black/18 p-1 ring-1 ring-white/[0.055] light:bg-white/72 light:ring-black/[0.055]">
                  <button
                    type="button"
                    onClick={() => onSetCartQuantity(cartItem.menuItem.id, cartItem.quantity - 1)}
                    className="pressable grid size-9 place-items-center rounded-full text-white/68 transition duration-200 hover:bg-white/[0.075] hover:text-white light:text-black/62 light:hover:bg-black/[0.065] light:hover:text-black"
                    aria-label={`Decrease ${cartItem.menuItem.name}`}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-9 text-center text-sm font-semibold tabular-nums text-white light:text-black">{cartItem.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onSetCartQuantity(cartItem.menuItem.id, cartItem.quantity + 1)}
                    className="pressable grid size-9 place-items-center rounded-full text-white/68 transition duration-200 hover:bg-white/[0.075] hover:text-white light:text-black/62 light:hover:bg-black/[0.065] light:hover:text-black"
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
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Notes for the kitchen"
          className="mt-5 min-h-24 w-full rounded-button border border-transparent bg-white/[0.06] px-4 py-3 text-sm leading-6 text-white shadow-inner shadow-black/[0.04] outline-none ring-1 ring-white/[0.065] transition duration-200 placeholder:text-white/34 focus:bg-white/[0.08] focus:ring-saffron/35 light:bg-black/[0.035] light:text-black light:ring-black/[0.055] light:placeholder:text-black/35 light:focus:bg-white light:focus:ring-ember/30"
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
          onClick={onSubmitOrder}
          disabled={isSubmitting || cart.length === 0}
          className="pressable mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-button bg-ember px-5 py-4 font-semibold text-white shadow-[0_18px_44px_rgb(var(--color-primary)_/_0.28)] transition duration-200 md:hover:-translate-y-0.5 md:hover:shadow-[0_22px_54px_rgb(var(--color-primary)_/_0.34)] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <ReceiptText size={18} /> {isSubmitting ? "Sending..." : "Place Order"}
        </button>
        {trackOrderId && (
          <Link
            href={`/track/${trackOrderId}`}
            className="pressable mt-3 inline-flex w-full items-center justify-center gap-2 rounded-button border border-white/[0.08] bg-white/[0.045] px-4 py-3 text-sm font-semibold text-white/62 hover:bg-white/[0.07] light:border-black/[0.07] light:bg-black/[0.025] light:text-black/58 light:hover:bg-black/[0.045]"
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
            onClick={() => onRequestStaff(type as StaffRequestType)}
            disabled={requestingType !== null}
            className="pressable min-h-[68px] rounded-button border border-transparent bg-transparent px-3 py-3 text-sm font-semibold text-white/52 ring-1 ring-white/[0.055] transition duration-200 hover:bg-white/[0.035] hover:text-white/70 light:text-black/48 light:ring-black/[0.05] light:hover:bg-black/[0.03] light:hover:text-black/66"
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
  );
}
