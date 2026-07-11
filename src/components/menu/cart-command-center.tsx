import Link from "next/link";
import { ArrowLeft, BellRing, CheckCircle2, Minus, Plus, ReceiptText, Sparkles } from "lucide-react";
import { currency } from "@/lib/utils";
import type { CartItem, Order, StaffRequestType, Table, TableMode } from "@/types";
import { EmptyCartState } from "@/components/menu/empty-cart-state";

export function CartCommandCenter({
  cart,
  tableNumber,
  tableMode,
  activeTables,
  hasValidTable,
  tableMessage,
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
  onRequestStaff,
  isMobileReviewOpen,
  onCloseMobileReview
}: {
  cart: CartItem[];
  tableNumber: string;
  tableMode: TableMode;
  activeTables: Table[];
  hasValidTable: boolean;
  tableMessage: string | null;
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
  isMobileReviewOpen: boolean;
  onCloseMobileReview: () => void;
}) {
  const hasCartItems = cart.length > 0;

  return (
    <aside
      id="order-panel"
      className={`min-w-0 scroll-mt-24 pt-3 lg:sticky lg:top-24 lg:block lg:self-start lg:pt-0 ${
        isMobileReviewOpen ? "block" : "hidden"
      }`}
    >
      <div className="rounded-[18px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] lg:min-h-[calc(100vh-7rem)] lg:rounded-none lg:border-y-0 lg:border-r-0 lg:p-4 lg:shadow-none">
        <button
          type="button"
          onClick={onCloseMobileReview}
          className="pressable mb-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-slate-100 px-4 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200 lg:hidden"
        >
          <ArrowLeft size={16} /> Back to menu
        </button>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Order Summary</p>
            <h2 className="mt-1 text-[22px] font-bold tracking-[-0.04em] text-slate-950 lg:text-xl">Your order</h2>
          </div>
          <span className="grid size-10 place-items-center rounded-full bg-slate-950 text-sm font-bold text-white lg:size-9 lg:text-xs">
            {cart.length}
          </span>
        </div>
        <div className="mt-5 lg:hidden">
          <TableContextControl
            tableNumber={tableNumber}
            tableMode={tableMode}
            activeTables={activeTables}
            tableMessage={tableMessage}
            onTableNumberChange={onTableNumberChange}
          />
        </div>
        <div className="mt-5 space-y-3 lg:mt-4 lg:max-h-[42vh] lg:space-y-2 lg:overflow-y-auto lg:pr-1">
          {cart.length === 0 ? (
            <EmptyCartState />
          ) : (
            cart.map((cartItem) => (
              <div key={cartItem.menuItem.id} className="rounded-2xl bg-white p-3 ring-1 ring-slate-200/80 lg:rounded-[12px] lg:bg-slate-50/70 lg:p-2.5">
                <div className="flex items-start justify-between gap-4">
                  <p className="min-w-0 text-[15px] font-bold leading-5 text-slate-950 lg:text-sm">{cartItem.menuItem.name}</p>
                  <p className="shrink-0 text-sm font-bold tabular-nums text-slate-700">
                    {currency(cartItem.menuItem.price * cartItem.quantity)}
                  </p>
                </div>
                <div className="mt-3 inline-flex items-center rounded-full bg-slate-50 p-1 ring-1 ring-slate-200 lg:mt-2 lg:bg-white">
                  <button
                    type="button"
                    onClick={() => onSetCartQuantity(cartItem.menuItem.id, cartItem.quantity - 1)}
                    className="pressable grid size-9 place-items-center rounded-full text-slate-500 transition duration-200 hover:bg-slate-100 hover:text-slate-950 lg:size-8"
                    aria-label={`Decrease ${cartItem.menuItem.name}`}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-9 text-center text-sm font-bold tabular-nums text-slate-950 lg:min-w-8">{cartItem.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onSetCartQuantity(cartItem.menuItem.id, cartItem.quantity + 1)}
                    className="pressable grid size-9 place-items-center rounded-full text-slate-500 transition duration-200 hover:bg-slate-100 hover:text-slate-950 lg:size-8"
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
          className="mt-5 min-h-20 w-full rounded-button border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition duration-200 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 lg:hidden"
        />
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:rounded-[12px] lg:p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 lg:text-xs">Order Value</span>
            <span className="text-2xl font-bold text-slate-950 lg:text-xl">{currency(subtotal)}</span>
          </div>
          <p className="mt-2 text-xs font-medium text-slate-400 lg:mt-1.5 lg:leading-5">Taxes and payment are handled by the restaurant.</p>
        </div>
        <button
          type="button"
          onClick={onSubmitOrder}
          disabled={isSubmitting || !hasCartItems || !hasValidTable}
          className={`pressable mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-button px-5 py-4 font-bold transition duration-200 lg:mt-3 lg:min-h-12 ${
            hasCartItems && hasValidTable
              ? "bg-emerald-500 text-white shadow-[0_18px_44px_rgba(16,185,129,0.26)] hover:bg-emerald-600 md:hover:-translate-y-0.5 lg:shadow-[0_12px_28px_rgba(16,185,129,0.18)]"
              : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 shadow-none"
          } disabled:cursor-not-allowed`}
        >
          <ReceiptText size={18} /> {isSubmitting ? "Sending..." : "Place Order"}
        </button>
        <div className="mt-3 hidden rounded-[12px] border border-slate-200 bg-white p-3 lg:block">
          <div className="flex items-center justify-between gap-3">
            <TableContextControl
              tableNumber={tableNumber}
              tableMode={tableMode}
              activeTables={activeTables}
              tableMessage={tableMessage}
              onTableNumberChange={onTableNumberChange}
              compact
            />
          </div>
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Kitchen notes"
            className="mt-2 min-h-12 w-full rounded-[10px] border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs leading-4 text-slate-950 outline-none transition duration-200 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />
        </div>
        {trackOrderId && (
          <Link
            href={`/track/${trackOrderId}`}
            className="pressable mt-3 inline-flex w-full items-center justify-center gap-2 rounded-button border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 lg:bg-white lg:py-2.5 lg:text-slate-500 lg:hover:bg-slate-50"
          >
            <CheckCircle2 size={17} /> Track {lastOrder?.orderNumber ?? "latest order"}
          </Link>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ["bill", "Bill"],
          ["water", "Water"],
          ["assistance", "Help"]
        ].map(([type, label]) => (
          <button
            type="button"
            key={type}
            onClick={() => onRequestStaff(type as StaffRequestType)}
            disabled={requestingType !== null || !hasValidTable}
            className="pressable min-h-[68px] rounded-button border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-500 shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition duration-200 hover:bg-slate-50 hover:text-slate-950 lg:min-h-12 lg:py-2 lg:text-xs lg:shadow-[0_4px_12px_rgba(15,23,42,0.035)]"
          >
            <BellRing className="mx-auto mb-1" size={16} />
            {requestingType === type ? "Sending" : label}
          </button>
        ))}
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
        <Sparkles size={14} /> {syncError ?? (isRefreshing ? "Syncing latest data..." : "Orders sync to the kitchen in real time.")}
      </p>
    </aside>
  );
}

function TableContextControl({
  tableNumber,
  tableMode,
  activeTables,
  tableMessage,
  onTableNumberChange,
  compact = false
}: {
  tableNumber: string;
  tableMode: TableMode;
  activeTables: Table[];
  tableMessage: string | null;
  onTableNumberChange: (value: string) => void;
  compact?: boolean;
}) {
  if (tableMode === "demo-selector") {
    return (
      <label className={`block min-w-0 flex-1 font-bold text-slate-500 ${compact ? "text-[10px] uppercase tracking-[0.12em]" : "text-sm"}`}>
        Demo table selector
        <select
          value={tableNumber}
          onChange={(event) => onTableNumberChange(event.target.value)}
          className={`w-full rounded-[10px] border border-slate-200 bg-slate-50 font-bold text-slate-950 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 ${compact ? "mt-1.5 h-8 px-2.5 text-sm" : "mt-2 h-11 px-4 text-sm"}`}
        >
          {!tableNumber && <option value="">Select a table</option>}
          {activeTables.map((table) => (
            <option key={table.id} value={table.number}>{table.label}</option>
          ))}
        </select>
        {tableMessage && <span className="mt-2 block text-xs normal-case tracking-normal text-amber-700">{tableMessage}</span>}
      </label>
    );
  }

  return (
    <div className="min-w-0 flex-1">
      <p className={`font-bold text-slate-500 ${compact ? "text-[10px] uppercase tracking-[0.12em]" : "text-sm"}`}>Table</p>
      <p className={`${compact ? "mt-1.5 text-sm" : "mt-2 text-base"} font-bold text-slate-950`}>
        {tableNumber ? `Ordering for Table ${tableNumber}` : "Table QR required"}
      </p>
      {tableMessage && <p className="mt-2 text-xs font-semibold text-amber-700">{tableMessage}</p>}
    </div>
  );
}
