import Image from "next/image";
import { Plus, Sparkles } from "lucide-react";
import { currency } from "@/lib/utils";
import type { MenuItem } from "@/types";

export function FeaturedSection({
  items,
  onAddToCart
}: {
  items: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mt-5 lg:hidden" aria-label="Featured dishes">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">Featured</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-white light:text-black">House picks</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-saffron/10 px-3 py-1.5 text-xs font-semibold text-saffron ring-1 ring-saffron/15">
          <Sparkles size={13} /> Popular
        </span>
      </div>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
        {items.map((item) => (
          <article
            key={item.id}
            className="relative min-w-[82%] snap-start overflow-hidden rounded-card bg-white/[0.055] shadow-[0_16px_42px_rgba(0,0,0,0.18)] ring-1 ring-white/[0.075] light:bg-white/88 light:shadow-[0_14px_34px_rgba(40,28,18,0.08)] light:ring-black/[0.055]"
          >
            <div className="relative h-44 bg-white/[0.04]">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="82vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.64),rgba(0,0,0,0.06)_62%)]" />
              <span className="absolute left-3 top-3 rounded-full bg-black/52 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-saffron ring-1 ring-white/14 backdrop-blur-md">
                Chef&apos;s Choice
              </span>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold leading-tight text-white light:text-black">{item.name}</h3>
              <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-white/52 light:text-black/54">
                {item.description}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-lg font-semibold text-white light:text-black">{currency(item.price)}</p>
                <button
                  type="button"
                  onClick={() => onAddToCart(item)}
                  className="pressable inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-ember px-4 text-sm font-semibold text-white shadow-[0_12px_26px_rgb(var(--color-primary)_/_0.22)]"
                >
                  <Plus size={15} /> Add
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
