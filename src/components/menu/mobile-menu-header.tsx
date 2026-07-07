import { Clock3, MapPin } from "lucide-react";
import type { RestaurantSettings } from "@/types";

export function MobileMenuHeader({
  settings,
  tableNumber
}: {
  settings: RestaurantSettings;
  tableNumber: string;
}) {
  return (
    <div className="sticky top-16 z-30 -mx-4 border-b border-white/[0.07] bg-ink/94 px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.22)] backdrop-blur-xl light:border-black/[0.06] light:bg-cream/94 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-button bg-ember text-xs font-semibold tracking-[0.16em] text-white shadow-[0_12px_28px_rgb(var(--color-primary)_/_0.22)]">
            NS
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-tight text-white light:text-black">
              {settings.name}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-white/52 light:text-black/52">
              <MapPin size={12} className="text-saffron" />
              {settings.tagline}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="inline-flex h-8 items-center rounded-full bg-white/[0.07] px-3 text-xs font-semibold text-white/78 ring-1 ring-white/[0.07] light:bg-black/[0.04] light:text-black/68 light:ring-black/[0.055]">
            Table {tableNumber || "?"}
          </span>
          <p className="mt-1.5 flex items-center justify-end gap-1 text-[11px] font-medium text-emerald-200 light:text-emerald-700">
            <Clock3 size={11} /> Open
          </p>
        </div>
      </div>
    </div>
  );
}
