import { ShoppingBag } from "lucide-react";

export function EmptyCartState() {
  return (
    <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center ring-1 ring-slate-200/80 lg:bg-white/[0.035] lg:ring-white/[0.065] light:lg:bg-black/[0.025] light:lg:ring-black/[0.055]">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 lg:bg-saffron/10 lg:text-saffron lg:ring-saffron/15">
        <ShoppingBag size={19} />
      </span>
      <p className="mt-5 font-bold text-slate-950 lg:font-semibold lg:text-white light:lg:text-black">Your cart is empty</p>
      <p className="mx-auto mt-2 max-w-[240px] text-sm leading-6 text-slate-500 lg:text-white/48 light:lg:text-black/50">
        Add a steak, cocktail, or side to start your table order.
      </p>
    </div>
  );
}
