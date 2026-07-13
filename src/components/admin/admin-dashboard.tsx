"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ChefHat,
  ChevronDown,
  ChevronUp,
  ClipboardList,
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
import { DailyReportingSection } from "@/components/admin/daily-reporting-section";
import { restaurantConfig } from "@/config/restaurant";
import {
  filterAdminMenuAvailability,
  type AvailabilityFilter
} from "@/lib/admin-menu-availability-filter";
import { matchesAdminOrderSearch } from "@/lib/admin-order-search";
import { formatReportLocalDateTime } from "@/lib/reporting/date-ranges";
import { buildTableMenuUrl } from "@/lib/table-resolution";
import {
  buildTableQrPdfLayout,
  QR_SIZE_MM,
  sortTablesForQrPdf
} from "@/lib/table-qr-pdf-layout";
import { updateTableStatusAction } from "@/actions/order-actions";
import { useRestaurantRealtime } from "@/hooks/use-restaurant-realtime";
import type { AdminReportActionResult } from "@/lib/reporting/admin-report";
import { currency, statusLabel } from "@/lib/utils";
import type { RestaurantSnapshot } from "@/services/restaurant-service";
import type { OrderStatus, TableStatus } from "@/types";

const tableStatuses: TableStatus[] = ["available", "occupied", "needs_bill", "cleaning"];
const adminOrderStatusStyles: Record<OrderStatus, string> = {
  new: "bg-[rgb(var(--color-primary))] text-white ring-[rgb(var(--color-primary)/0.16)] shadow-[0_8px_18px_rgb(var(--color-primary)/0.2)]",
  preparing: "bg-amber-500 text-slate-950 ring-amber-600/10 shadow-[0_8px_18px_rgba(245,158,11,0.16)]",
  ready: "bg-emerald-600 text-white ring-emerald-700/10 shadow-[0_8px_18px_rgba(5,150,105,0.16)]",
  completed: "bg-slate-600 text-white ring-slate-700/10 shadow-[0_8px_18px_rgba(71,85,105,0.14)]"
};
const adminTableStatusStyles: Record<TableStatus, string> = {
  available: "bg-emerald-600 text-white ring-emerald-700/10 shadow-[0_8px_18px_rgba(5,150,105,0.18)]",
  occupied: "bg-amber-500 text-slate-950 ring-amber-600/10 shadow-[0_8px_18px_rgba(245,158,11,0.16)]",
  needs_bill: "bg-rose-600 text-white ring-rose-700/10 shadow-[0_8px_18px_rgba(225,29,72,0.16)]",
  cleaning: "bg-slate-700 text-white ring-slate-800/10 shadow-[0_8px_18px_rgba(51,65,85,0.16)]"
};

export function AdminDashboard({
  initialSnapshot,
  initialReportResult
}: {
  initialSnapshot: RestaurantSnapshot;
  initialReportResult: AdminReportActionResult;
}) {
  const [orderQuery, setOrderQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
  const [isDataMaintenanceOpen, setIsDataMaintenanceOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const dataMaintenanceTriggerRef = useRef<HTMLButtonElement | null>(null);
  const clearOrderDataTriggerRef = useRef<HTMLButtonElement | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const resetSubmissionRef = useRef(false);
  const { snapshot, refreshAll, refreshTables, isRefreshing, syncError, isRealtimeConnected } =
    useRestaurantRealtime(initialSnapshot);
  const { settings, categories, menuItems, orders, tables, staffRequests } = snapshot;

  const syncLabel = syncError ??
    (isRefreshing
      ? "Syncing dashboard data"
      : isRealtimeConnected
        ? "Realtime connected"
        : "Realtime reconnecting");
  const sortedTables = useMemo(() => sortTablesForAdmin(tables), [tables]);
  const liveStats: Array<{ label: string; value: string | number; detail: string }> = [
    {
      label: "Active Orders",
      value: orders.filter((order) => order.status !== "completed").length,
      detail: "Live new, preparing, and ready orders"
    },
    {
      label: "Open Staff Requests",
      value: staffRequests.filter((request) => request.status === "open").length,
      detail: "Current unresolved dining-room calls"
    },
    {
      label: "Tables In Service",
      value: tables.filter((table) => table.status === "occupied" || table.status === "needs_bill").length,
      detail: "Occupied tables and tables requesting the bill"
    }
  ];
  const liveOrdersRevision = useMemo(
    () =>
      orders
        .map(
          (order) =>
            `${order.id}:${order.status}:${order.updatedAt}:${order.items
              .map((item) => `${item.id}:${item.quantity}`)
              .join(",")}`
        )
        .join("|"),
    [orders]
  );
  const filteredOperationalOrders = useMemo(
    () => orders.filter((order) => matchesAdminOrderSearch(order.orderNumber, order.tableNumber, orderQuery)),
    [orders, orderQuery]
  );
  const menuAvailability = useMemo(
    () =>
      filterAdminMenuAvailability(menuItems, {
        searchQuery,
        selectedCategoryId,
        availabilityFilter
      }),
    [availabilityFilter, menuItems, searchQuery, selectedCategoryId]
  );
  const hasAvailabilityFilters =
    menuAvailability.normalizedSearchQuery.length > 0 ||
    selectedCategoryId !== null ||
    availabilityFilter !== "all";

  useEffect(() => {
    if (selectedCategoryId !== null && !categories.some((category) => category.id === selectedCategoryId)) {
      setSelectedCategoryId(null);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    if (!isResetDialogOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && busyAction !== "reset") {
        setIsResetDialogOpen(false);
        scheduleButtonFocus(focusFrameRef, clearOrderDataTriggerRef);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busyAction, isResetDialogOpen]);

  useEffect(() => {
    return () => {
      cancelScheduledFocus(focusFrameRef);
    };
  }, []);

  async function downloadQr(tableNumber: string) {
    const url = buildTableMenuUrl(window.location.origin, tableNumber);
    const dataUrl = await QRCode.toDataURL(url, { margin: 2, width: 512 });
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = `${slugify(settings.name)}-table-${tableNumber}-qr.png`;
    anchor.click();
  }

  async function downloadQrPdf() {
    const activeTables = tables.filter((table) => table.isActive);
    const layout = buildTableQrPdfLayout(sortTablesForQrPdf(activeTables));
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    if (layout.pageCount === 0) {
      doc.setFontSize(18);
      doc.text(`${settings.name} Table QR Codes`, 16, 18);
      doc.save(`${slugify(settings.name)}-table-qr-sheet.pdf`);
      return;
    }

    for (let pageIndex = 0; pageIndex < layout.pageCount; pageIndex += 1) {
      if (pageIndex > 0) doc.addPage("a4", "portrait");

      doc.setFontSize(18);
      doc.text(`${settings.name} Table QR Codes`, 16, 18);
      doc.setFontSize(10);
      doc.text(`Page ${pageIndex + 1} of ${layout.pageCount}`, 194, 18, { align: "right" });

      const pageSlots = layout.slots.filter((slot) => slot.pageIndex === pageIndex);
      for (const slot of pageSlots) {
        const dataUrl = await QRCode.toDataURL(buildTableMenuUrl(window.location.origin, slot.table.number), {
          margin: 1,
          width: 160
        });
        doc.addImage(dataUrl, "PNG", slot.x, slot.y, QR_SIZE_MM, QR_SIZE_MM);
        doc.text(slot.table.label, slot.x, slot.labelY);
      }
    }

    doc.save(`${slugify(settings.name)}-table-qr-sheet.pdf`);
  }

  async function runAdminAction(
    actionKey: string,
    action: () => Promise<void | AdminActionResult>,
    successMessage: string
  ): Promise<boolean> {
    if (busyAction) return false;

    setBusyAction(actionKey);
    try {
      const result = await action();
      if (result && !result.ok) {
        throw new Error(result.error ?? "Action failed.");
      }
      toast.success(successMessage);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
      return false;
    } finally {
      setBusyAction(null);
    }
  }

  function closeResetDialog() {
    if (busyAction === "reset") return;

    setIsResetDialogOpen(false);
    scheduleButtonFocus(focusFrameRef, clearOrderDataTriggerRef);
  }

  async function confirmClearOrderData() {
    if (resetSubmissionRef.current) return;

    resetSubmissionRef.current = true;
    try {
      const didClearOrderData = await runAdminAction("reset", async () => {
        const result = await resetDemoAction();
        if (!result.ok) return result;

        await refreshAll();
      }, "Order activity cleared.");

      if (didClearOrderData) {
        setIsResetDialogOpen(false);
        setIsDataMaintenanceOpen(false);
        scheduleButtonFocus(focusFrameRef, dataMaintenanceTriggerRef);
      }
    } finally {
      resetSubmissionRef.current = false;
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
              <Link
                href="/menu"
                className="pressable inline-flex min-h-11 items-center gap-2 rounded-button border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 md:hidden"
              >
                <Utensils size={16} />
                View Menu
              </Link>
              <Link
                href="/kitchen"
                className="pressable inline-flex min-h-11 items-center gap-2 rounded-button border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 md:hidden"
              >
                <ChefHat size={16} />
                Kitchen
              </Link>
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
              eyebrow="Live operations"
              title="Current service"
              description="Realtime service indicators from the existing operational snapshot."
              icon={<Activity size={18} />}
            />
            <div className="grid gap-4 md:grid-cols-3">
              {liveStats.map(({ label, value, detail }) => (
                <StatCard key={label} label={label} value={value} detail={detail} loading={isRefreshing && orders.length === 0} />
              ))}
            </div>

            <Panel>
              <PanelTitle icon={<Settings size={18} />} title="Restaurant profile" subtitle="Read-only operating context." />
              <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
                <InfoRow label="Restaurant" value={settings.name} />
                <InfoRow label="Tagline" value={settings.tagline} />
                <InfoRow label="Phone" value={settings.phone} />
              </div>
            </Panel>
          </section>

          <DailyReportingSection
            initialReportResult={initialReportResult}
            restaurantName={settings.name}
            liveOrdersRevision={liveOrdersRevision}
          />

          <section aria-labelledby="orders-heading" className="space-y-4">
            <SectionHeader
              eyebrow="Orders"
              title="Recent operational orders"
              description="Search the current live operational window. Use Daily Reporting above for complete range history and CSV export."
              icon={<ClipboardList size={18} />}
            />
            <Panel>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex min-h-11 w-full items-center gap-2 rounded-button border border-slate-200 bg-slate-50 px-3 text-slate-600 sm:max-w-sm">
                  <Search size={16} />
                  <input
                    type="search"
                    value={orderQuery}
                    onChange={(event) => setOrderQuery(event.target.value)}
                    placeholder="Search table or order #"
                    aria-label="Search recent operational orders"
                    className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </label>
                <span className="text-sm font-semibold text-slate-500">
                  {filteredOperationalOrders.length} matching orders
                </span>
              </div>
              <div className="mt-4 max-h-[520px] overflow-auto overscroll-contain">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="sticky top-0 z-10 border-b border-slate-200 bg-white text-xs uppercase tracking-[0.14em] text-slate-400">
                    <tr>
                      <th className="py-3 pr-4">Order</th>
                      <th className="pr-4">Table</th>
                      <th className="pr-4">Status</th>
                      <th className="pr-4">Total</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.length === 0 ? (
                      <tr className="text-slate-500">
                        <td colSpan={5} className="py-10 text-center">
                          No recent operational orders are available in the current live window.
                        </td>
                      </tr>
                    ) : filteredOperationalOrders.length === 0 ? (
                      <tr className="text-slate-500">
                        <td colSpan={5} className="py-10 text-center">
                          No orders match this search.
                        </td>
                      </tr>
                    ) : filteredOperationalOrders.map((order) => (
                      <tr key={order.id} className="text-slate-700">
                        <td className="py-4 pr-4 font-black text-slate-950">{order.orderNumber}</td>
                        <td className="pr-4 font-bold">Table {order.tableNumber}</td>
                        <td className="pr-4">
                          <AdminOrderStatusBadge status={order.status} />
                        </td>
                        <td className="pr-4 font-bold">{currency(order.subtotal)}</td>
                        <td className="text-slate-500">
                          {formatReportLocalDateTime(order.createdAt, restaurantConfig.timeZone)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </section>

          <div className="grid min-w-0 max-w-full gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <section aria-labelledby="menu-heading" className="min-w-0 max-w-full space-y-4">
              <SectionHeader
                eyebrow="Menu"
                title="Availability controls"
                description="Keep current item availability updated without changing menu structure."
                icon={<Utensils size={18} />}
              />
              <Panel className="min-w-0 max-w-full overflow-hidden">
                <div className="min-w-0 space-y-4">
                  <label className="flex min-h-11 w-full min-w-0 max-w-full items-center gap-2 rounded-button border border-orange-100 bg-orange-50/70 px-3 text-orange-700">
                    <Search size={16} />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search menu items"
                      aria-label="Search menu items for availability controls"
                      className="w-full min-w-0 max-w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                    />
                  </label>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Category</p>
                    <div className="mt-2 w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-1">
                      <div className="flex w-max min-w-full gap-2 pr-1" aria-label="Filter menu availability by category">
                        <button
                          type="button"
                          aria-pressed={selectedCategoryId === null}
                          onClick={() => setSelectedCategoryId(null)}
                          className={`pressable min-h-10 shrink-0 rounded-full px-4 text-sm font-black ${
                            selectedCategoryId === null
                              ? "bg-[rgb(var(--color-primary))] text-white shadow-[0_10px_22px_rgb(var(--color-primary)/0.2)]"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          All
                        </button>
                        {categories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            aria-pressed={selectedCategoryId === category.id}
                            onClick={() => setSelectedCategoryId(category.id)}
                            className={`pressable min-h-10 shrink-0 rounded-full px-4 text-sm font-black ${
                              selectedCategoryId === category.id
                                ? "bg-[rgb(var(--color-primary))] text-white shadow-[0_10px_22px_rgb(var(--color-primary)/0.2)]"
                                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Availability</p>
                    <div className="mt-2 grid w-full min-w-0 grid-cols-3 gap-2" aria-label="Filter menu availability by status">
                      {(["all", "available", "sold_out"] as AvailabilityFilter[]).map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          aria-pressed={availabilityFilter === filter}
                          onClick={() => setAvailabilityFilter(filter)}
                          className={`pressable min-h-10 w-full min-w-0 rounded-button px-2 text-sm font-black sm:px-3 ${
                            availabilityFilter === filter
                              ? "bg-[rgb(var(--color-primary))] text-white shadow-[0_10px_22px_rgb(var(--color-primary)/0.2)]"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {filter === "all" ? "All" : filter === "available" ? "Available" : "Sold out"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-100 py-3">
                    <p className="text-sm font-semibold text-slate-500">
                      {hasAvailabilityFilters
                        ? `${formatMenuItemCount(menuAvailability.items.length, "matching")} · ${formatSoldOutCount(menuAvailability.completeSoldOutCount, true)}`
                        : `${formatMenuItemCount(menuAvailability.completeItemCount)} · ${formatSoldOutCount(menuAvailability.completeSoldOutCount)}`}
                    </p>
                    {hasAvailabilityFilters ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategoryId(null);
                          setAvailabilityFilter("all");
                        }}
                        className="pressable min-h-10 rounded-button border border-slate-200 bg-white px-3 text-sm font-black text-slate-600 hover:bg-slate-50"
                      >
                        Clear filters
                      </button>
                    ) : null}
                  </div>

                  {menuAvailability.completeItemCount === 0 ? (
                    <EmptyState>No menu items are available yet.</EmptyState>
                  ) : selectedCategoryId !== null && menuAvailability.selectedCategoryItemCount === 0 ? (
                    <EmptyState>No items are in this category yet.</EmptyState>
                  ) : availabilityFilter !== "all" && menuAvailability.postAvailabilityCount === 0 ? (
                    <EmptyState>
                      {availabilityFilter === "available"
                        ? selectedCategoryId === null ? "No available items." : "No available items in this category."
                        : selectedCategoryId === null ? "No sold-out items." : "No sold-out items in this category."}
                    </EmptyState>
                  ) : menuAvailability.items.length === 0 ? (
                    <EmptyState>
                      {menuAvailability.normalizedSearchQuery.length > 0 && selectedCategoryId === null && availabilityFilter === "all"
                        ? `No items match “${menuAvailability.normalizedSearchQuery}”.`
                        : "No items match these filters."}
                    </EmptyState>
                  ) : (
                    <div className="min-w-0 max-h-[560px] max-w-full space-y-3 overflow-y-auto overscroll-contain pr-1">
                      {menuAvailability.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex min-w-0 max-w-full items-center justify-between gap-4 rounded-[18px] border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="min-w-0 flex-1">
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
                  )}
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
                    ref={dataMaintenanceTriggerRef}
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

            <section aria-labelledby="system-heading" className="min-w-0 space-y-4">
              <SectionHeader
                eyebrow="Advanced"
                title="Data maintenance"
                description="Manage stored order and service activity for this restaurant."
                icon={<Settings size={18} />}
              />
              <Panel className="min-w-0 max-w-full">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-6 text-slate-500">
                      Data controls are kept separate from daily restaurant operations.
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-expanded={isDataMaintenanceOpen}
                    aria-controls="data-maintenance-controls"
                    onClick={() => setIsDataMaintenanceOpen((isOpen) => !isOpen)}
                    className="pressable inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-button border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50"
                  >
                    {isDataMaintenanceOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {isDataMaintenanceOpen ? "Hide data controls" : "Manage data"}
                  </button>
                </div>

                {isDataMaintenanceOpen ? (
                  <div id="data-maintenance-controls" className="mt-5 border-t border-slate-200 pt-5">
                    <div className="rounded-[18px] border border-rose-200 bg-rose-50/50 p-4 sm:p-5">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-700">
                          <AlertTriangle size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-rose-600">Danger zone</p>
                          <h3 className="mt-1 font-black text-slate-950">Clear order activity</h3>
                          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                            Permanently deletes all orders, order items, and service requests, then returns active tables to Available. Menu items, categories, restaurant settings, admin accounts, and staff access are not affected.
                          </p>
                          <p className="mt-3 text-sm font-black text-rose-700">This action cannot be undone.</p>
                        </div>
                      </div>
                      <button
                        ref={clearOrderDataTriggerRef}
                        type="button"
                        aria-controls="clear-order-activity-dialog"
                        onClick={() => setIsResetDialogOpen(true)}
                        disabled={busyAction !== null}
                        className="pressable mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-button bg-rose-600 px-4 py-2.5 text-sm font-black text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-200 disabled:text-rose-400"
                      >
                        <RefreshCcw size={16} />
                        Clear all order data
                      </button>
                    </div>
                  </div>
                ) : null}
              </Panel>
            </section>
          </div>
        </main>
      </div>
      <ConfirmationDialog
        open={isResetDialogOpen}
        isSubmitting={busyAction === "reset"}
        onClose={closeResetDialog}
        onConfirm={() => void confirmClearOrderData()}
      />
    </div>
  );
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

function formatMenuItemCount(count: number, modifier?: "matching") {
  return `${count} ${modifier ? `${modifier} ` : ""}item${count === 1 ? "" : "s"}`;
}

function formatSoldOutCount(count: number, includeTotal = false) {
  return `${count} sold out${includeTotal ? " total" : ""}`;
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

function AdminTableStatusBadge({ status }: { status: TableStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] ring-1 ${adminTableStatusStyles[status]}`}
    >
      {statusLabel(status)}
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

function scheduleButtonFocus(
  frameRef: { current: number | null },
  buttonRef: { current: HTMLButtonElement | null }
) {
  cancelScheduledFocus(frameRef);

  frameRef.current = window.requestAnimationFrame(() => {
    frameRef.current = null;
    buttonRef.current?.focus();
  });
}

function cancelScheduledFocus(frameRef: { current: number | null }) {
  if (frameRef.current !== null) {
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }
}

function ConfirmationDialog({
  open,
  isSubmitting,
  onClose,
  onConfirm
}: {
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        id="clear-order-activity-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-order-activity-title"
        aria-describedby="clear-order-activity-description"
        className="w-full max-w-lg rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.28)] sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-700">
            <AlertTriangle size={18} />
          </span>
          <div className="min-w-0">
            <h2 id="clear-order-activity-title" className="text-xl font-black tracking-[-0.025em] text-slate-950">
              Clear all order activity?
            </h2>
            <div id="clear-order-activity-description" className="mt-3 space-y-3 text-sm font-medium leading-6 text-slate-600">
              <p>This permanently deletes all orders, order items, and service requests, then returns active tables to Available.</p>
              <p>Menu items, categories, restaurant settings, admin accounts, and staff access will not be changed.</p>
              <p className="font-black text-rose-700">This action cannot be undone.</p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            disabled={isSubmitting}
            className="pressable min-h-11 rounded-button border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="pressable min-h-11 rounded-button bg-rose-600 px-4 py-2.5 text-sm font-black text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-200 disabled:text-rose-400"
          >
            {isSubmitting ? "Clearing..." : "Clear all order data"}
          </button>
        </div>
      </section>
    </div>
  );
}
