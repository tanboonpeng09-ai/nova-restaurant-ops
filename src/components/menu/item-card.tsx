import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { currency } from "@/lib/utils";
import type { MenuItem } from "@/types";

export function ItemCard({
  item,
  quantity,
  onAddToCart,
  onDecreaseQuantity
}: {
  item: MenuItem;
  quantity: number;
  onAddToCart: (item: MenuItem) => void;
  onDecreaseQuantity: (item: MenuItem, quantity: number) => void;
}) {
  const isInCart = quantity > 0;

  return (
    <article
      className={`group flex min-h-[104px] gap-3 overflow-hidden rounded-[16px] bg-white p-2 shadow-[0_6px_18px_rgba(15,23,42,0.045)] ring-1 ring-slate-200/80 transition duration-200 lg:block lg:min-h-0 lg:rounded-[13px] lg:p-1.5 lg:shadow-[0_2px_8px_rgba(15,23,42,0.032)] lg:ring-slate-200/70 lg:hover:-translate-y-0.5 lg:hover:shadow-[0_7px_16px_rgba(15,23,42,0.055)] ${
        item.isAvailable ? "" : "opacity-70"
      }`}
    >
      <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[12px] bg-slate-100 lg:h-[108px] lg:w-auto lg:rounded-[11px] 2xl:h-[104px]">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="(max-width: 1024px) 88px, (max-width: 1280px) 33vw, 22vw"
          className={`object-cover transition duration-200 lg:group-hover:scale-[1.02] ${
            item.isAvailable ? "" : "saturate-[0.55] grayscale"
          }`}
        />
        {!item.isAvailable && (
          <div className="absolute inset-0 grid place-items-center bg-white/50 lg:bg-black/36">
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-700 shadow-soft lg:px-3.5 lg:py-2 lg:text-[11px] lg:text-black">
              Sold Out
            </span>
          </div>
        )}
      </div>
      <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] gap-x-3 gap-y-1 py-0.5 lg:flex lg:min-h-[92px] lg:flex-col lg:px-1 lg:pb-1 lg:pt-2">
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-[14px] font-bold leading-tight tracking-[-0.02em] text-slate-950 lg:text-[15px]">
            {item.name}
          </h2>
          {item.isFeatured && item.isAvailable && (
            <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 lg:px-1.5 lg:py-0 lg:text-[9px]">
              Chef&apos;s Choice
            </span>
          )}
          <p className="mt-1 line-clamp-2 text-[12px] leading-[1.35rem] text-slate-600 lg:mt-1 lg:line-clamp-1 lg:text-[11px] lg:leading-4">
            {item.description}
          </p>
        </div>
        <p className="shrink-0 text-right text-[13px] font-bold tracking-[-0.02em] text-slate-950 lg:hidden">
          {currency(item.price)}
        </p>
        <div className="col-span-2 mt-auto flex justify-end lg:flex lg:items-center lg:justify-between lg:gap-2 lg:pt-2">
          <span className="hidden text-[15px] font-bold tracking-[-0.04em] text-slate-950 lg:block">
            {currency(item.price)}
          </span>
          {isInCart ? (
            <div className="inline-flex h-8 items-center rounded-full bg-slate-100 p-1 ring-1 ring-slate-200 lg:h-7">
              <button
                type="button"
                onClick={() => onDecreaseQuantity(item, quantity)}
                className="pressable grid size-6 place-items-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-950"
                aria-label={`Decrease ${item.name}`}
              >
                <Minus size={13} />
              </button>
              <span className="min-w-6 text-center text-xs font-black tabular-nums text-slate-950">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onAddToCart(item)}
                className="pressable grid size-6 place-items-center rounded-full text-slate-500 transition hover:bg-white hover:text-slate-950"
                aria-label={`Increase ${item.name}`}
              >
                <Plus size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!item.isAvailable}
              onClick={() => onAddToCart(item)}
              className="pressable grid size-8 place-items-center rounded-full bg-slate-100 text-slate-950 ring-1 ring-slate-200 transition hover:bg-slate-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 lg:size-7"
              aria-label={item.isAvailable ? `Add ${item.name}` : `${item.name} sold out`}
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
