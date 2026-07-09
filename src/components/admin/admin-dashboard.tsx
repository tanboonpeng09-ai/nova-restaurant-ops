"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Download,
  LayoutDashboard,
  LogOut,
  Power,
  QrCode,
  RefreshCcw,
  Search,
  Settings,
  Table2,
  Utensils,
  Wifi,
  WifiOff
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import {
  type AdminActionResult,
  resetDemoAction,
  signOutAction,
  toggleItemAvailabilityAction,
  toggleOrderingAction
} from "@/actions/admin-actions";
import { restaurantConfig } from "@/config/restaurant";
import { updateTableStatusAction } from "@/actions/order-actions";
import { useRestaurantRealtime } from "@/hooks/use-restaurant-realtime";
import { currency, statusLabel } from "@/lib/utils";
import type { RestaurantSnapshot } from "@/services/restaurant-service";
import type { OrderStatus, TableStatus } from "@/types";

const tableStatuses: TableStatus[] = ["available", "occupied", "needs_bill", "cleaning"];
const adminOrderStatusStyles: Record<OrderStatus, string> = {
  new: "bg-teal-600 text-white ring-teal-700/10 shadow-[0_8px_18px_rgba(13,148,136,0.16)]",
  preparing: "bg-amber-500 text-slate-950 ring-amber-600/10 shadow-[0_8px_18px_rgba(245,158,11,0.16)]",
  ready: "bg-blue-600 text-white ring-blue-700/10 shadow-[0_8px_18px_rgba(37,99,235,0.16)]",
  completed: "bg-slate-600 text-white ring-slate-700/10 shadow-[0_8px_18px_rgba(71,85,105,0.14)]"
};
const adminTableStatusStyles: Record<TableStatus, string> = {
  available: "bg-emerald-600 text-white ring-emerald-700/10 shadow-[0_8px_18px_rgba(5,150,105,0.18)]",
  occupied: "bg-amber-500 text-slate-950 ring-amber-600/10 shadow-[0_8px_18px_rgba(245,158,11,0.16)]",
  needs_bill: "bg-rose-600 text-white ring-rose-700/10 shadow-[0_8px_18px_rgba(225,29,72,0.16)]",
  cleaning: "bg-slate-700 text-white ring-slate-800/10 shadow-[0_8px_18px_rgba(51,65,85,0.16)]"
};

export function AdminDashboard({ initialSnapshot }: { initialSnapshot: RestaurantSnapshot }) {
  const [query, setQuery] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const { snapshot, refreshAll, refreshTables, isRefreshing, syncError, isRealtimeConnected } =
    useRestaurantRealtime(initialSnapshot);
  const { settings, menuItems, orders, tables, staffRequests } = snapshot;

  const stats = useMemo(() => {
    const total = orders.reduce((sum, order) => sum + order.subtotal, 0);
    const average = orders.length ? total / orders.length : 0;
    const itemCounts = new Map<string, number>();
    orders.forEach((order) =>
      order.items.forEach((item) => {
        itemCounts.set(item.itemName, (itemCounts.get(item.itemName) ?? 0) + item.quantity);
      })
    );
    const popular = [...itemCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "No orders yet";
    return { total, average, popular, active: orders.filter((order) => order.status !== "completed").length };
  }, [orders]);

  const chartData = useMemo(() => {
    const ordersByHour = new Map<number, number>();

    orders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      ordersByHour.set(hour, (ordersByHour.get(hour) ?? 0) + 1);
    });

    return [...ordersByHour.entries()]
      .sort(([leftHour], [rightHour]) => leftHour - rightHour)
      .map(([hour, orderCount]) => ({
        hour: format(new Date(2026, 0, 1, hour), "h a"),
        orders: orderCount
      }));
  }, [orders]);

  const filteredOrders = orders.filter(
    (order) =>
      order.tableNumber.includes(query) ||
      order.orderNumber.toLowerCase().includes(query.toLowerCase())
  );

  const syncLabel = syncError ??
    (isRefreshing
      ? "Syncing dashboard data"
      : isRealtimeConnected
        ? "Realtime connected"
        : "Realtime reconnecting");
  const sortedTables = useMemo(() => sortTablesForAdmin(tables), [tables]);
  const statCards: Array<{ label: string; value: string | number; detail: string }> = [
    { label: "Orders Today", value: orders.length, detail: "Latest 100 orders in the current data window" },
    { label: "Active Orders", value: stats.active, detail: "Orders not yet completed" },
    { label: "Order Value", value: currency(stats.total), detail: "Gross value from loaded orders" },
    { label: "Average Value", value: currency(stats.average), detail: "Average value per loaded order" }
  ];

  function exportCsv() {
    const filePrefix = slugify(settings.name);
    const rows = [
      ["Order Number", "Table", "Status", "Order Value", "Created"],
      ...orders.map((order) => [
        order.orderNumber,
        order.tableNumber,
        order.status,
        String(order.subtotal),
        order.createdAt
      ])
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${filePrefix}-orders.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function downloadQr(tableNumber: string) {
    const url = `${window.location.origin}/menu?table=${tableNumber}`;
    const dataUrl = await QRCode.toDataURL(url, { margin: 2, width: 512 });
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = `${slugify(settings.name)}-table-${tableNumber}-qr.png`;
    anchor.click();
  }

  async function downloadQrPdf() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${settings.name} Table QR Codes`, 16, 18);
    for (let index = 0; index < tables.length; index += 1) {
      const table = tables[index];
      const x = 16 + (index % 3) * 62;
      const y = 30 + Math.floor(index / 3) * 62;
      const dataUrl = await QRCode.toDataURL(`${window.location.origin}/menu?table=${table.number}`, {
        margin: 1,
        width: 160
      });
      doc.addImage(dataUrl, "PNG", x, y, 42, 42);
      doc.setFontSize(10);
      doc.text(table.label, x, y + 48);
    }
    doc.save(`${slugify(settings.name)}-table-qr-sheet.pdf`);
  }

  async function runAdminAction(
    actionKey: string,
    action: () => Promise<void | AdminActionResult>,
    successMessage: string
  ) {
    if (busyAction) return;

    setBusyAction(actionKey);
    try {
      const result = await action();
      if (result && !result.ok) {
        throw new Error(result.error ?? "Action failed.");
      }
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="light min-h-[calc(100vh-4rem)] bg-[#f5f7fb] text-slate-950">
      <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.07)] lg:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-white">
                  <LayoutDashboard size={14} />
                  Owner cockpit
                </span>
                <StatusPill
                  tone={settings.orderingEnabled ? "success" : "danger"}
                  label={settings.orderingEnabled ? "Ordering open" : "Ordering closed"}
                />
                <StatusPill
                  tone={syncError ? "warning" : isRealtimeConnected ? "success" : "warning"}
                  label={syncLabel}
                  icon={isRealtimeConnected && !syncError ? <Wifi size={14} /> : <WifiOff size={14} />}
                />
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
                Restaurant operations
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
                Monitor service health, orders, menu availability, tables, QR tools, and staff requests from one
                operator-grade dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (
                    settings.orderingEnabled &&
                    !window.confirm("Turn ordering off? Customers will not be able to place orders.")
                  ) {
                    return;
                  }
                  await runAdminAction("ordering", async () => {
                    await toggleOrderingAction(settings.orderingEnabled);
                    await refreshAll();
                  }, "Ordering setting updated.");
                }}
                disabled={busyAction !== null}
                className={`pressable inline-flex min-h-11 items-center gap-2 rounded-button px-4 py-2.5 text-sm font-black shadow-[0_14px_30px_rgba(15,23,42,0.08)] disabled:cursor-not-allowed disabled:opacity-60 ${
                  settings.orderingEnabled
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-rose-500 text-white hover:bg-rose-600"
                }`}
              >
                <Power size={16} />
                {busyAction === "ordering" ? "Updating..." : `Ordering ${settings.orderingEnabled ? "ON" : "OFF"}`}
              </button>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="pressable inline-flex min-h-11 items-center gap-2 rounded-button border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="mt-6 space-y-6">
          <section aria-labelledby="overview-heading" className="space-y-4">
            <SectionHeader
              eyebrow="Overview"
              title="Live operating snapshot"
              description="A quick read on order volume, active service load, sales value, and current sync state."
              icon={<Activity size={18} />}
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {statCards.map(({ label, value, detail }) => (
                <StatCard key={label} label={label} value={value} detail={detail} loading={isRefreshing && orders.length === 0} />
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <Panel>
                <PanelTitle icon={<BarChart3 size={18} />} title="Busy hours" subtitle="Real order counts from loaded orders." />
                {chartData.length === 0 ? (
                  <div className="mt-5 grid h-72 place-items-center rounded-[18px] border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                    <p className="text-sm font-semibold text-slate-500">No orders yet for this data window.</p>
                  </div>
                ) : (
                  <div className="mt-5 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.28)" />
                        <XAxis dataKey="hour" stroke="#64748b" tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip
                          cursor={{ fill: "rgba(15,23,42,0.04)" }}
                          contentStyle={{
                            borderRadius: 16,
                            border: "1px solid rgb(226,232,240)",
                            boxShadow: "0 18px 50px rgba(15,23,42,0.12)"
                          }}
                        />
                        <Bar dataKey="orders" fill={restaurantConfig.theme.colors.primary} radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Panel>

              <Panel>
                <PanelTitle icon={<Settings size={18} />} title="Restaurant profile" subtitle="Read-only operating context." />
                <div className="mt-5 grid gap-3 text-sm">
                  <InfoRow label="Restaurant" value={settings.name} />
                  <InfoRow label="Tagline" value={settings.tagline} />
                  <InfoRow label="Phone" value={settings.phone} />
                  <InfoRow label="Popular item" value={stats.popular} />
                </div>
              </Panel>
            </div>
          </section>

          <section aria-labelledby="orders-heading" className="space-y-4">
            <SectionHeader
              eyebrow="Orders"
              title="Order history"
              description="Search recent table orders and export the current order list."
              icon={<ClipboardList size={18} />}
              action={
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={orders.length === 0}
                  className="pressable inline-flex min-h-10 items-center gap-2 rounded-button bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  <Download size={16} />
                  CSV
                </button>
              }
            />
            <Panel>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex min-h-11 w-full items-center gap-2 rounded-button border border-slate-200 bg-slate-50 px-3 text-slate-600 sm:max-w-sm">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search table or order #"
                    className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </label>
                <span className="text-sm font-semibold text-slate-500">{filteredOrders.length} matching orders</span>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.14em] text-slate-400">
                    <tr>
                      <th className="py-3 pr-4">Order</th>
                      <th className="pr-4">Table</th>
                      <th className="pr-4">Status</th>
                      <th className="pr-4">Order Value</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.length === 0 ? (
                      <tr className="text-slate-500">
                        <td colSpan={5} className="py-10 text-center">
                          No orders match this view.
                        </td>
                      </tr>
                    ) : filteredOrders.map((order) => (
                      <tr key={order.id} className="text-slate-700">
                        <td className="py-4 pr-4 font-black text-slate-950">{order.orderNumber}</td>
                        <td className="pr-4 font-bold">Table {order.tableNumber}</td>
                        <td className="pr-4">
                          <AdminOrderStatusBadge status={order.status} />
                        </td>
                        <td className="pr-4 font-bold">{currency(order.subtotal)}</td>
                        <td className="text-slate-500">{format(new Date(order.createdAt), "MMM d, h:mm a")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </section>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <section aria-labelledby="menu-heading" className="space-y-4">
              <SectionHeader
                eyebrow="Menu"
                title="Availability controls"
                description="Keep current item availability updated without changing menu structure."
                icon={<Utensils size={18} />}
              />
              <Panel>
                <div className="grid gap-3">
                  {menuItems.length === 0 ? (
                    <EmptyState>No menu items are available.</EmptyState>
                  ) : menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-[18px] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-950">{item.name}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{currency(item.price)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await runAdminAction(`item-${item.id}`, async () => {
                            await toggleItemAvailabilityAction(item.id, item.isAvailable);
                            await refreshAll();
                          }, "Availability updated.");
                        }}
                        disabled={busyAction !== null}
                        className={`pressable min-h-10 shrink-0 rounded-full px-4 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60 ${
                          item.isAvailable
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {busyAction === `item-${item.id}` ? "Updating..." : item.isAvailable ? "Available" : "Sold out"}
                      </button>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>

            <section aria-labelledby="tables-heading" className="space-y-4">
              <SectionHeader
                eyebrow="Tables & QR"
                title="Table operations"
                description="Update table state and download guest ordering QR assets."
                icon={<Table2 size={18} />}
                action={
                  <button
                    type="button"
                    onClick={downloadQrPdf}
                    disabled={tables.length === 0}
                    className="pressable inline-flex min-h-10 items-center gap-2 rounded-button bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    <QrCode size={16} />
                    PDF Sheet
                  </button>
                }
              />
              <Panel>
                <div className="grid gap-3 md:grid-cols-2">
                  {tables.length === 0 ? (
                    <EmptyState>No active tables are configured.</EmptyState>
                  ) : sortedTables.map((table) => (
                    <div key={table.id} className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-black text-slate-950">{table.label}</p>
                        <AdminTableStatusBadge status={table.status} />
                      </div>
                      <select
                        value={table.status}
                        onChange={async (event) => {
                          await runAdminAction(`table-${table.id}`, async () => {
                            await updateTableStatusAction({
                              tableId: table.id,
                              status: event.target.value as TableStatus
                            });
                            await refreshTables();
                          }, "Table status updated.");
                        }}
                        disabled={busyAction !== null}
                        className="mt-3 min-h-11 w-full rounded-button border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                      >
                        {tableStatuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => downloadQr(table.number)}
                        className="pressable mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-button border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                      >
                        <QrCode size={16} />
                        Download QR
                      </button>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_0.72fr]">
            <section aria-labelledby="requests-heading" className="space-y-4">
              <SectionHeader
                eyebrow="Staff Requests"
                title="Service calls"
                description="Current customer requests from the dining room."
                icon={<Utensils size={18} />}
              />
              <Panel>
                <div className="grid gap-3 md:grid-cols-3">
                  {staffRequests.length === 0 ? (
                    <EmptyState>No staff requests are open.</EmptyState>
                  ) : staffRequests.map((request) => (
                    <div key={request.id} className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-950">
                            Table {request.tableNumber}: {statusLabel(request.type)}
                          </p>
                          <p className="mt-1 text-sm font-semibold capitalize text-slate-500">{request.status}</p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${
                            request.status === "open"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>

            <section aria-labelledby="system-heading" className="space-y-4">
              <SectionHeader
                eyebrow="System"
                title="Demo tools"
                description="Destructive controls are isolated from daily operations."
                icon={<AlertTriangle size={18} />}
              />
              <Panel className="border-rose-200 bg-rose-50">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-700">
                    <AlertTriangle size={18} />
                  </span>
                  <div>
                    <h3 className="font-black text-rose-950">Reset demo data</h3>
                    <p className="mt-1 text-sm font-medium leading-6 text-rose-700">
                      Clears demo orders and requests, then returns active tables to available.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm("Reset demo orders and requests? This cannot be undone.")) return;
                    void runAdminAction("reset", async () => {
                      await resetDemoAction();
                      await refreshAll();
                    }, "Demo data reset.");
                  }}
                  disabled={busyAction !== null}
                  className="pressable mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-button bg-rose-600 px-4 py-2.5 text-sm font-black text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-200 disabled:text-rose-400"
                >
                  <RefreshCcw size={16} />
                  {busyAction === "reset" ? "Resetting..." : "Reset Demo"}
                </button>
              </Panel>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function sortTablesForAdmin<T extends { number: string; label: string }>(tables: T[]) {
  return tables
    .map((table, index) => ({ table, index, numericOrder: getTableNumericOrder(table) }))
    .sort((left, right) => {
      if (left.numericOrder !== null && right.numericOrder !== null && left.numericOrder !== right.numericOrder) {
        return left.numericOrder - right.numericOrder;
      }

      if (left.numericOrder !== null && right.numericOrder === null) return -1;
      if (left.numericOrder === null && right.numericOrder !== null) return 1;

      return left.index - right.index;
    })
    .map(({ table }) => table);
}

function getTableNumericOrder(table: { number: string; label: string }) {
  return extractFirstNumber(table.number) ?? extractFirstNumber(table.label);
}

function extractFirstNumber(value: string) {
  const match = value.match(/\d+/)?.[0];
  return match ? Number.parseInt(match, 10) : null;
}

function StatusPill({
  label,
  tone,
  icon
}: {
  label: string;
  tone: "success" | "warning" | "danger";
  icon?: React.ReactNode;
}) {
  const toneClass = {
    success: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    warning: "bg-amber-100 text-amber-700 ring-amber-200",
    danger: "bg-rose-100 text-rose-700 ring-rose-200"
  }[tone];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ring-1 ${toneClass}`}>
      {icon}
      {label}
    </span>
  );
}

function AdminOrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] ring-1 ${adminOrderStatusStyles[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function AdminTableStatusBadge({ status }: { status: TableStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] ring-1 ${adminTableStatusStyles[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon,
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
          <span className="grid size-7 place-items-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200">
            {icon}
          </span>
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-slate-950">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  loading
}: {
  label: string;
  value: string | number;
  detail: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_42px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      {loading ? (
        <div className="mt-4 h-9 w-24 animate-pulse rounded-full bg-slate-100" />
      ) : (
        <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
      )}
      <p className="mt-2 min-h-10 text-sm font-medium leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function Panel({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_42px_rgba(15,23,42,0.06)] ${className}`}>
      {children}
    </section>
  );
}

function PanelTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">
        {icon}
      </span>
      <div>
        <h3 className="font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-slate-200 bg-slate-50 p-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-black text-slate-950">{value}</span>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500 md:col-span-full">
      {children}
    </div>
  );
}
