import Image from "next/image";
import { Plus } from "lucide-react";
import { currency } from "@/lib/utils";
import type { MenuItem } from "@/types";

export function ItemCard({
  item,
  onAddToCart
}: {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}) {
  return (
    <article
      className={`group overflow-hidden rounded-card bg-white/[0.05] p-3.5 shadow-[0_18px_48px_rgba(0,0,0,0.16)] ring-1 ring-white/[0.075] transition duration-200 md:hover:-translate-y-1 md:hover:bg-white/[0.065] md:hover:shadow-[0_24px_64px_rgba(0,0,0,0.22)] light:bg-white/88 light:shadow-[0_16px_40px_rgba(40,28,18,0.09)] light:ring-black/[0.055] light:md:hover:bg-white ${
        item.isAvailable ? "" : "opacity-80"
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-white/[0.04]">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={`object-cover transition duration-200 md:group-hover:scale-[1.02] ${
            item.isAvailable ? "" : "saturate-[0.55] grayscale"
          }`}
        />
        {item.isFeatured && item.isAvailable && (
          <span className="absolute left-3 top-3 rounded-full bg-black/56 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-saffron ring-1 ring-white/14 backdrop-blur-md">
            Chef&apos;s Choice
          </span>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 grid place-items-center bg-black/36">
            <span className="rounded-full bg-white/90 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-black shadow-soft">
              Sold Out
            </span>
          </div>
        )}
      </div>
      <div className="flex min-h-[174px] flex-col px-2 pb-2 pt-5">
        <h2 className="text-[1.45rem] font-semibold leading-tight tracking-tight text-white light:text-black">
          {item.name}
        </h2>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/52 light:text-black/54">
          {item.description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-4 pt-7">
          <p className="text-[1.35rem] font-semibold tracking-tight text-white light:text-black">
            {currency(item.price)}
          </p>
          <button
            type="button"
            disabled={!item.isAvailable}
            onClick={() => onAddToCart(item)}
            className="pressable inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-ember px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(255,107,44,0.22)] transition md:hover:-translate-y-0.5 md:hover:bg-[#ff7c42] disabled:cursor-not-allowed disabled:bg-white/[0.12] disabled:text-white/48 disabled:shadow-none light:disabled:bg-black/[0.08] light:disabled:text-black/42"
          >
            <Plus size={16} /> {item.isAvailable ? "Add" : "Sold out"}
          </button>
        </div>
      </div>
    </article>
  );
}
