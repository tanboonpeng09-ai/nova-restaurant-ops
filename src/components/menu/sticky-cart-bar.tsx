import { ReceiptText } from "lucide-react";
import { currency } from "@/lib/utils";

export function StickyCartBar({
  itemCount,
  subtotal,
  isSubmitting,
  onSubmitOrder
}: {
  itemCount: number;
  subtotal: number;
  isSubmitting: boolean;
  onSubmitOrder: () => void;
}) {
  if (itemCount === 0) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 rounded-[24px] border border-white/[0.1] bg-ink/96 p-3 shadow-[0_18px_48px_rgba(0,0,0,0.36)] backdrop-blur-xl light:border-black/[0.08] light:bg-cream/96 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 pl-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/44 light:text-black/45">
            {itemCount} {itemCount === 1 ? "item" : "items"} in order
          </p>
          <p className="mt-0.5 text-lg font-semibold text-white light:text-black">{currency(subtotal)}</p>
        </div>
        <button
          type="button"
          onClick={onSubmitOrder}
          disabled={isSubmitting}
          className="pressable inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-ember px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(255,107,44,0.24)] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <ReceiptText size={16} /> {isSubmitting ? "Sending" : "Place order"}
        </button>
      </div>
    </div>
  );
}
