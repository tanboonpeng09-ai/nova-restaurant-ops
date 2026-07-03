import { cn, statusLabel } from "@/lib/utils";
import type { OrderStatus, TableStatus } from "@/types";

const orderStyles: Record<OrderStatus, string> = {
  new: "bg-ember/[0.12] text-orange-200 ring-ember/25 light:text-orange-700",
  preparing: "bg-saffron/[0.12] text-yellow-100 ring-saffron/25 light:text-yellow-700",
  ready: "bg-emerald-400/[0.12] text-emerald-100 ring-emerald-400/25 light:text-emerald-700",
  completed: "bg-white/[0.08] text-white/68 ring-white/[0.08] light:text-black/60"
};

const tableStyles: Record<TableStatus, string> = {
  available: "bg-emerald-400/[0.12] text-emerald-100 ring-emerald-400/25 light:text-emerald-700",
  occupied: "bg-saffron/[0.12] text-yellow-100 ring-saffron/25 light:text-yellow-700",
  needs_bill: "bg-rose-400/[0.12] text-rose-100 ring-rose-400/25 light:text-rose-700",
  cleaning: "bg-sky-400/[0.12] text-sky-100 ring-sky-400/25 light:text-sky-700"
};

export function StatusBadge({ status }: { status: OrderStatus | TableStatus }) {
  const styles =
    status in orderStyles
      ? orderStyles[status as OrderStatus]
      : tableStyles[status as TableStatus];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ring-1",
        styles
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
