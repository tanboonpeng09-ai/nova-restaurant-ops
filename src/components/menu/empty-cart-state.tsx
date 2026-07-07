import { ShoppingBag } from "lucide-react";

export function EmptyCartState() {
  return (
    <div className="rounded-2xl bg-white/[0.035] px-5 py-8 text-center ring-1 ring-white/[0.065] light:bg-black/[0.025] light:ring-black/[0.055]">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-white/[0.055] text-saffron ring-1 ring-white/[0.06] light:bg-black/[0.04] light:ring-black/[0.05]">
        <ShoppingBag size={19} />
      </span>
      <p className="mt-5 font-semibold text-white light:text-black">Your cart is empty</p>
      <p className="mx-auto mt-2 max-w-[240px] text-sm leading-6 text-white/48 light:text-black/50">
        Add a steak, cocktail, or side to start your table order.
      </p>
    </div>
  );
}
