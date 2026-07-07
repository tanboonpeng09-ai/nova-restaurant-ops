import { ShoppingBag } from "lucide-react";
import { currency } from "@/lib/utils";

export function StickyCartBar({
  itemCount,
  subtotal,
  onReviewOrder
}: {
  itemCount: number;
  subtotal: number;
  onReviewOrder: () => void;
}) {
  if (itemCount === 0) return null;

  return (
    <div className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 rounded-full bg-slate-950 p-2 shadow-[0_18px_44px_rgba(15,23,42,0.28)] ring-1 ring-white/10 lg:hidden">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <div className="min-w-[58px] pl-3 text-[11px] font-black uppercase tracking-[0.16em] text-white/72">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </div>
        <button
          type="button"
          onClick={onReviewOrder}
          className="pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(16,185,129,0.28)] transition duration-200 active:scale-[0.98]"
        >
          <ShoppingBag size={15} /> Review Order
        </button>
        <p className="pr-3 text-right text-base font-black tabular-nums tracking-[-0.03em] text-white">
          {currency(subtotal)}
        </p>
      </div>
    </div>
  );
}
