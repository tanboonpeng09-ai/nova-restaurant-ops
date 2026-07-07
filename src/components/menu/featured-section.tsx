import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { currency } from "@/lib/utils";
import type { MenuItem } from "@/types";

export function FeaturedSection({
  items,
  getItemQuantity,
  onAddToCart,
  onDecreaseQuantity
}: {
  items: MenuItem[];
  getItemQuantity: (itemId: string) => number;
  onAddToCart: (item: MenuItem) => void;
  onDecreaseQuantity: (item: MenuItem, quantity: number) => void;
}) {
  if (items.length === 0) return null;

  const primaryItem = items[0];
  const quantity = getItemQuantity(primaryItem.id);
  const isInCart = quantity > 0;

  return (
    <section className="mt-4 lg:hidden" aria-label="Featured dishes">
      <div className="mb-2.5">
        <h2 className="text-[22px] font-bold tracking-[-0.04em] text-slate-950">Featured</h2>
      </div>
      <article className="overflow-hidden rounded-[18px] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80">
        <div className="relative h-36 bg-slate-100">
          <Image
            src={primaryItem.imageUrl}
            alt={primaryItem.name}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_8px_18px_rgba(245,158,11,0.28)]">
            Popular
          </span>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-3 p-3.5">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-[20px] font-bold tracking-[-0.04em] text-slate-950">
              {primaryItem.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-[14px] leading-5 text-slate-600">
              {primaryItem.description}
            </p>
          </div>
          <div className="flex flex-col items-end justify-between gap-3">
            <p className="text-[20px] font-bold tracking-[-0.04em] text-slate-950">
              {currency(primaryItem.price)}
            </p>
            {isInCart ? (
              <div className="inline-flex h-11 items-center rounded-full bg-slate-950 p-1 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]">
                <button
                  type="button"
                  onClick={() => onDecreaseQuantity(primaryItem, quantity)}
                  className="pressable grid size-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label={`Decrease ${primaryItem.name}`}
                >
                  <Minus size={15} />
                </button>
                <span className="min-w-7 text-center text-sm font-black tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onAddToCart(primaryItem)}
                  className="pressable grid size-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label={`Increase ${primaryItem.name}`}
                >
                  <Plus size={15} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAddToCart(primaryItem)}
                className="pressable grid size-11 place-items-center rounded-full bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition active:scale-[0.98]"
                aria-label={`Add ${primaryItem.name}`}
              >
                <Plus size={18} />
              </button>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}
