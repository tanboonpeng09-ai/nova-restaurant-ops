"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  BarChart3,
  Download,
  KeyRound,
  QrCode,
  RefreshCcw,
  Search,
  Settings,
  Utensils
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import {
  resetDemoAction,
  signOutAction,
  toggleItemAvailabilityAction,
  toggleOrderingAction
} from "@/actions/admin-actions";
import { updateTableStatusAction } from "@/actions/order-actions";
import { useRestaurantRealtime } from "@/hooks/use-restaurant-realtime";
import { StatusBadge } from "@/components/shared/status-badge";
import { currency, statusLabel } from "@/lib/utils";
import type { RestaurantSnapshot } from "@/services/restaurant-service";
import type { TableStatus } from "@/types";

const tableStatuses: TableStatus[] = ["available", "occupied", "needs_bill", "cleaning"];

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

  const chartData = useMemo(
    () =>
      ["12 PM", "2 PM", "4 PM", "6 PM", "8 PM", "10 PM"].map((hour, index) => ({
        hour,
        orders: [2, 4, 3, 8, 11, 6][index]
      })),
    []
  );

  const filteredOrders = orders.filter(
    (order) =>
      order.tableNumber.includes(query) ||
      order.orderNumber.toLowerCase().includes(query.toLowerCase())
  );

  function exportCsv() {
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
    anchor.download = "nova-orders.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function downloadQr(tableNumber: string) {
    const url = `${window.location.origin}/menu?table=${tableNumber}`;
    const dataUrl = await QRCode.toDataURL(url, { margin: 2, width: 512 });
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = `nova-table-${tableNumber}-qr.png`;
    anchor.click();
  }

  async function downloadQrPdf() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("NOVA STEAKHOUSE Table QR Codes", 16, 18);
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
    doc.save("nova-table-qr-sheet.pdf");
  }

  async function runAdminAction(actionKey: string, action: () => Promise<void>, successMessage: string) {
    if (busyAction) return;

    setBusyAction(actionKey);
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-ember">Owner dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white light:text-black">Restaurant operations</h1>
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
            className="pressable rounded-button bg-white px-4 py-3 text-sm font-semibold text-black"
          >
            {busyAction === "ordering" ? "Updating..." : `Ordering ${settings.orderingEnabled ? "ON" : "OFF"}`}
          </button>
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
            className="pressable inline-flex items-center gap-2 rounded-button border border-white/[0.09] bg-white/[0.065] px-4 py-3 text-sm font-semibold text-white light:bg-white/78 light:text-black"
          >
            <RefreshCcw size={16} /> {busyAction === "reset" ? "Resetting..." : "Reset Demo"}
          </button>
          <form action={signOutAction}>
            <button
              type="submit"
              className="pressable rounded-button border border-white/[0.09] bg-white/[0.065] px-4 py-3 text-sm font-semibold text-white light:bg-white/78 light:text-black"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
      <p className="mt-3 text-sm text-white/45 light:text-black/45">
        {syncError ??
          (isRefreshing
            ? "Syncing dashboard data..."
            : isRealtimeConnected
              ? "Realtime connected."
              : "Realtime reconnecting...")}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          ["Orders Today", orders.length],
          ["Active Orders", stats.active],
          ["Today's Orders Value", currency(stats.total)],
          ["Average Order Value", currency(stats.average)]
        ].map(([label, value]) => (
          <div key={label} className="interactive-card mesh-panel rounded-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/42 light:text-black/44">
              {label}
            </p>
            {isRefreshing && orders.length === 0 ? (
              <div className="mt-4 h-9 w-24 animate-pulse rounded-full bg-white/[0.07] light:bg-black/[0.06]" />
            ) : (
              <p className="mt-3 text-3xl font-semibold tracking-tight text-white light:text-black">{value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="mesh-panel rounded-card p-5">
          <div className="mb-5 flex items-center gap-2">
            <BarChart3 className="text-ember" />
            <h2 className="text-xl font-semibold tracking-tight text-white light:text-black">Busy hours</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                <XAxis dataKey="hour" stroke="currentColor" />
                <YAxis stroke="currentColor" />
                <Tooltip />
                <Bar dataKey="orders" fill="#FF6B2C" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="mesh-panel rounded-card p-5">
          <div className="flex items-center gap-2">
            <Settings className="text-saffron" />
            <h2 className="text-xl font-semibold tracking-tight text-white light:text-black">Branding</h2>
          </div>
          <div className="mt-5 space-y-4 text-sm">
            <InfoRow label="Restaurant" value={settings.name} />
            <InfoRow label="Tagline" value={settings.tagline} />
            <InfoRow label="Phone" value={settings.phone} />
            <InfoRow label="Kitchen PIN" value={settings.kitchenPin} icon={<KeyRound size={16} />} />
            <InfoRow label="Popular Item" value={stats.popular} />
          </div>
        </section>
      </div>

      <section className="mt-6 mesh-panel rounded-card p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="text-xl font-semibold tracking-tight text-white light:text-black">Order history</h2>
          <div className="flex gap-2">
            <label className="input-surface flex items-center gap-2 rounded-button px-3 py-2">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Table or order #"
                className="bg-transparent text-sm outline-none placeholder:text-white/35 light:text-black light:placeholder:text-black/35"
              />
            </label>
            <button
              type="button"
              onClick={exportCsv}
              disabled={orders.length === 0}
              className="pressable inline-flex items-center gap-2 rounded-button bg-ember px-4 py-2 text-sm font-semibold text-white"
            >
              <Download size={16} /> CSV
            </button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-white/42 light:text-black/44">
              <tr>
                <th className="py-3">Order</th>
                <th>Table</th>
                <th>Status</th>
                <th>Order Value</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr className="fine-divider border-t text-white/55 light:text-black/55">
                  <td colSpan={5} className="py-8 text-center">
                    No orders match this view.
                  </td>
                </tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="fine-divider border-t text-white/80 light:text-black/80">
                  <td className="py-4 font-semibold">{order.orderNumber}</td>
                  <td>{order.tableNumber}</td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td>{currency(order.subtotal)}</td>
                  <td>{format(new Date(order.createdAt), "MMM d, h:mm a")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="mesh-panel rounded-card p-5">
          <h2 className="text-xl font-semibold tracking-tight text-white light:text-black">Menu availability</h2>
          <div className="mt-4 grid gap-3">
            {menuItems.length === 0 ? (
              <div className="surface-soft rounded-2xl p-5 text-sm text-white/55 light:text-black/55">
                No menu items are available.
              </div>
            ) : menuItems.map((item) => (
              <div key={item.id} className="surface-soft flex items-center justify-between rounded-2xl p-4">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-white/45 light:text-black/45">{currency(item.price)}</p>
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
                  className={`rounded-button px-4 py-2 text-sm font-semibold ${
                    item.isAvailable ? "bg-emerald-400/[0.12] text-emerald-100 light:text-emerald-700" : "bg-rose-400/[0.12] text-rose-100 light:text-rose-700"
                  }`}
                >
                  {busyAction === `item-${item.id}` ? "Updating..." : item.isAvailable ? "Available" : "Sold out"}
                </button>
              </div>
            ))}
          </div>
        </section>
        <section className="mesh-panel rounded-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-white light:text-black">Tables & QR</h2>
            <button
              type="button"
              onClick={downloadQrPdf}
              disabled={tables.length === 0}
              className="pressable inline-flex items-center gap-2 rounded-button bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              <QrCode size={16} /> PDF Sheet
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {tables.length === 0 ? (
              <div className="surface-soft rounded-2xl p-5 text-sm text-white/55 light:text-black/55">
                No active tables are configured.
              </div>
            ) : tables.map((table) => (
              <div key={table.id} className="surface-soft rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{table.label}</p>
                  <StatusBadge status={table.status} />
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
                  className="input-surface mt-3 w-full rounded-button px-3 py-2 text-sm outline-none"
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
                  className="pressable mt-3 w-full rounded-button border border-white/[0.09] px-3 py-2 text-sm font-semibold light:border-black/[0.08]"
                >
                  Download QR
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 mesh-panel rounded-card p-5">
        <div className="flex items-center gap-2">
          <Utensils className="text-ember" />
          <h2 className="text-xl font-semibold tracking-tight text-white light:text-black">Staff requests</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {staffRequests.length === 0 ? (
            <div className="surface-soft rounded-2xl p-5 text-sm text-white/55 light:text-black/55 md:col-span-3">
              No staff requests are open.
            </div>
          ) : staffRequests.map((request) => (
            <div key={request.id} className="surface-soft rounded-2xl p-4">
              <p className="font-semibold">
                Table {request.tableNumber}: {statusLabel(request.type)}
              </p>
              <p className="mt-1 text-sm capitalize text-white/45 light:text-black/45">{request.status}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="surface-soft flex items-center justify-between gap-4 rounded-2xl p-4">
      <span className="text-white/50 light:text-black/50">{label}</span>
      <span className="flex items-center gap-2 text-right font-semibold text-white light:text-black">
        {icon}
        {value}
      </span>
    </div>
  );
}
