import { Utensils } from "lucide-react";
import type { RestaurantSettings } from "@/types";

export function MobileMenuHeader({
  settings,
  tableNumber
}: {
  settings: Pick<RestaurantSettings, "name">;
  tableNumber: string;
}) {
  return (
    <div className="sticky top-0 z-30 -mx-4 border-b border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.06)] backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-white shadow-[0_10px_22px_rgba(15,23,42,0.14)]">
            <Utensils size={17} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[20px] font-bold tracking-[-0.03em] text-slate-950">
              {settings.name}
            </p>
            <p className="mt-0.5 truncate text-xs font-medium text-slate-500">Table ordering</p>
          </div>
        </div>
        <span className="inline-flex h-8 shrink-0 items-center rounded-full bg-slate-100 px-3 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
          {tableNumber ? `Table ${tableNumber}` : "Scan table QR"}
        </span>
      </div>
    </div>
  );
}
