"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Download,
  RefreshCcw,
  Search,
  TrendingUp
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { loadAdminReportAction } from "@/actions/admin-actions";
import { restaurantConfig } from "@/config/restaurant";
import { matchesAdminOrderSearch } from "@/lib/admin-order-search";
import { getAdminOrderTablePagination } from "@/lib/admin-order-table-pagination";
import {
  buildReportCsv,
  getReportCsvFilename,
  type AdminReport,
  type AdminReportActionResult
} from "@/lib/reporting/admin-report";
import {
  formatReportLocalDateTime,
  getReportRangeLabel,
  reportRanges,
  type ReportRange
} from "@/lib/reporting/date-ranges";
import { currency, statusLabel } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const reportStatusStyles: Record<OrderStatus, string> = {
  new: "bg-teal-600 text-white",
  preparing: "bg-amber-500 text-slate-950",
  ready: "bg-blue-600 text-white",
  completed: "bg-slate-600 text-white"
};

export function DailyReportingSection({
  initialReportResult,
  restaurantName,
  liveOrdersRevision
}: {
  initialReportResult: AdminReportActionResult;
  restaurantName: string;
  liveOrdersRevision: string;
}) {
  const initialReport = initialReportResult.ok ? initialReportResult.report : null;
  const [report, setReport] = useState<AdminReport | null>(initialReport);
  const [activeRange, setActiveRange] = useState<ReportRange>(initialReport?.bounds.range ?? "today");
  const [pendingRange, setPendingRange] = useState<ReportRange | null>(null);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [error, setError] = useState(initialReportResult.ok ? null : initialReportResult.error);
  const [failedRange, setFailedRange] = useState<ReportRange | null>(
    initialReportResult.ok ? null : "today"
  );
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const activeRangeRef = useRef(activeRange);
  const realtimeRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRevisionRef = useRef(true);
  const requestIdRef = useRef(0);
  const rangeSwitchPendingRef = useRef(false);
  const orderResultsRef = useRef<HTMLDivElement | null>(null);
  const paginationScrollFrameRef = useRef<number | null>(null);

  useEffect(() => {
    activeRangeRef.current = activeRange;
  }, [activeRange]);

  useEffect(() => {
    return () => {
      if (paginationScrollFrameRef.current !== null) {
        cancelAnimationFrame(paginationScrollFrameRef.current);
      }
    };
  }, []);

  const loadRange = useCallback(async (range: ReportRange, background = false) => {
    if (background && rangeSwitchPendingRef.current) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (background) setIsBackgroundRefreshing(true);
    else {
      rangeSwitchPendingRef.current = true;
      setPendingRange(range);
      setPage(1);
    }
    setError(null);

    try {
      const result = await loadAdminReportAction(range);
      if (requestId !== requestIdRef.current) return;
      if (!result.ok) throw new Error(result.error);

      setReport(result.report);
      setActiveRange(range);
      setFailedRange(null);
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return;
      setFailedRange(range);
      setError(loadError instanceof Error ? loadError.message : "Could not load this report.");
    } finally {
      if (requestId === requestIdRef.current) {
        setPendingRange(null);
        setIsBackgroundRefreshing(false);
        if (!background) rangeSwitchPendingRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    if (isFirstRevisionRef.current) {
      isFirstRevisionRef.current = false;
      return;
    }

    if (realtimeRefreshTimerRef.current) clearTimeout(realtimeRefreshTimerRef.current);
    realtimeRefreshTimerRef.current = setTimeout(() => {
      if (!rangeSwitchPendingRef.current) void loadRange(activeRangeRef.current, true);
    }, 1_000);

    return () => {
      if (realtimeRefreshTimerRef.current) clearTimeout(realtimeRefreshTimerRef.current);
    };
  }, [liveOrdersRevision, loadRange]);

  const filteredOrders = useMemo(() => {
    if (!report) return [];
    return report.orders.filter((order) =>
      matchesAdminOrderSearch(order.orderNumber, order.tableNumber, query)
    );
  }, [query, report]);
  const orderPagination = getAdminOrderTablePagination(filteredOrders.length, page);
  const paginatedOrders = filteredOrders.slice(orderPagination.startIndex, orderPagination.endIndex);

  useEffect(() => {
    if (page !== orderPagination.page) setPage(orderPagination.page);
  }, [orderPagination.page, page]);

  function changeOrderPage(nextPage: number) {
    setPage(nextPage);
    if (paginationScrollFrameRef.current !== null) {
      cancelAnimationFrame(paginationScrollFrameRef.current);
    }

    paginationScrollFrameRef.current = requestAnimationFrame(() => {
      paginationScrollFrameRef.current = null;
      const orderResults = orderResultsRef.current;
      if (!orderResults) return;

      orderResults.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start"
      });
    });
  }

  function exportCsv() {
    if (!report) return;
    const blob = new Blob([buildReportCsv(report)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = getReportCsvFilename(restaurantName, report);
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const isLoading = pendingRange !== null;

  return (
    <section aria-labelledby="reporting-heading" className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            <span className="grid size-7 place-items-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200">
              <TrendingUp size={16} />
            </span>
            Sales and order reporting
          </p>
          <h2 id="reporting-heading" className="mt-2 text-2xl font-black tracking-[-0.035em] text-slate-950">
            Selected-range report
          </h2>
          <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
            Created-order activity and completed-order subtotals. Reporting timezone: {restaurantConfig.timeZone}.
          </p>
        </div>

        <div className="flex max-w-full flex-wrap gap-2" aria-label="Reporting range">
          {reportRanges.map((range) => {
            const isActive = activeRange === range;
            const isPending = pendingRange === range;
            return (
              <button
                key={range}
                type="button"
                onClick={() => void loadRange(range)}
                disabled={isLoading}
                aria-pressed={isActive}
                className={`pressable min-h-10 rounded-button px-3.5 text-sm font-black transition disabled:cursor-wait ${
                  isActive
                    ? "bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {isPending ? "Loading..." : getReportRangeLabel(range)}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div role="alert" className="flex flex-col gap-3 rounded-[18px] border border-rose-200 bg-rose-50 p-4 text-rose-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold">{error}</p>
          <button
            type="button"
            onClick={() => void loadRange(failedRange ?? activeRange)}
            disabled={isLoading}
            className="pressable inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-button bg-rose-600 px-4 text-sm font-black text-white disabled:opacity-60"
          >
            <RefreshCcw size={15} /> Retry
          </button>
        </div>
      )}

      {!report ? (
        <ReportLoadingState />
      ) : (
        <div className="space-y-4" aria-busy={isLoading || isBackgroundRefreshing}>
          <div className="flex flex-col gap-2 rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={16} />
              {report.bounds.label}: {report.bounds.localStartDate}
              {report.bounds.localStartDate === report.bounds.localEndDateInclusive
                ? ""
                : ` to ${report.bounds.localEndDateInclusive}`}
            </span>
            <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
              {isLoading || isBackgroundRefreshing ? "Updating report..." : "Report ready"}
            </span>
          </div>

          <div className={`grid gap-4 md:grid-cols-2 xl:grid-cols-3 ${isLoading ? "opacity-60" : ""}`}>
            <ReportMetric label="Orders Placed" value={report.metrics.ordersPlaced} detail="All statuses created in this range" />
            <ReportMetric label="Completed Orders" value={report.metrics.completedOrders} detail="Orders currently marked completed" />
            <ReportMetric label="Open Orders" value={report.metrics.openOrders} detail="New, preparing, and ready orders" />
            <ReportMetric label="Completed-order Subtotal" value={currency(report.metrics.completedOrderSubtotal)} detail="Subtotal from completed orders only" />
            <ReportMetric label="Operational Order Value" value={currency(report.metrics.operationalOrderValue)} detail="Subtotal from every order in this range" />
            <ReportMetric label="Average Completed Order" value={currency(report.metrics.averageCompletedOrder)} detail="Completed subtotal divided by completed orders" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="flex h-full min-h-[360px] flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_42px_rgba(15,23,42,0.06)]">
              <ReportPanelTitle icon={<BarChart3 size={18} />} title="Busy hours" subtitle="All created orders, grouped in the restaurant timezone." />
              {report.busyHours.length === 0 ? (
                <ReportEmptyState>No order activity in this range.</ReportEmptyState>
              ) : (
                <div className="mt-5 min-h-[240px] flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.busyHours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.28)" />
                      <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
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
            </div>

            <div className="flex h-full min-h-[360px] flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_42px_rgba(15,23,42,0.06)]">
              <ReportPanelTitle icon={<TrendingUp size={18} />} title="Popular completed items" subtitle="Item quantities from completed orders only." />
              {report.popularItems.length === 0 ? (
                <ReportEmptyState>No completed items in this range.</ReportEmptyState>
              ) : (
                <div className="mt-5 min-h-0 max-h-72 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
                  {report.popularItems.map((item, index) => (
                    <div key={item.itemName} className="flex items-center justify-between gap-4 rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3">
                      <span className="min-w-0 truncate font-bold text-slate-950">
                        {index + 1}. {item.itemName}
                      </span>
                      <span className="shrink-0 text-sm font-black tabular-nums text-slate-600">{item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_42px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-950">Selected-range orders</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">All statuses created inside the active reporting range.</p>
              </div>
              <button
                type="button"
                onClick={exportCsv}
                disabled={report.orders.length === 0}
                className="pressable inline-flex min-h-10 items-center justify-center gap-2 rounded-button bg-slate-950 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                <Download size={16} /> CSV
              </button>
            </div>

            <div ref={orderResultsRef} className="mt-4 scroll-mt-24">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex min-h-11 w-full items-center gap-2 rounded-button border border-slate-200 bg-slate-50 px-3 text-slate-600 sm:max-w-sm">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Search table or order #"
                    className="w-full bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                  />
                </label>
                <span className="text-sm font-semibold text-slate-500">{filteredOrders.length} matching orders</span>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.14em] text-slate-400">
                    <tr>
                      <th className="py-3 pr-4">Order</th>
                      <th className="pr-4">Table</th>
                      <th className="pr-4">Status</th>
                      <th className="pr-4">Subtotal</th>
                      <th>Created Local</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center font-semibold text-slate-500">
                          No orders match this reporting view.
                        </td>
                      </tr>
                    ) : paginatedOrders.map((order) => (
                      <tr key={order.id} className="text-slate-700">
                        <td className="py-4 pr-4 font-black text-slate-950">{order.orderNumber}</td>
                        <td className="pr-4 font-bold">Table {order.tableNumber}</td>
                        <td className="pr-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${reportStatusStyles[order.status]}`}>
                            {statusLabel(order.status)}
                          </span>
                        </td>
                        <td className="pr-4 font-bold">{currency(order.subtotal)}</td>
                        <td className="text-slate-500">{formatReportLocalDateTime(order.createdAt, report.bounds.timeZone)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <span className="text-sm font-semibold text-slate-500">
                  Page {orderPagination.page} of {orderPagination.pageCount}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => changeOrderPage(orderPagination.page - 1)}
                    disabled={orderPagination.page === 1}
                    className="pressable inline-flex min-h-10 items-center justify-center rounded-button border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => changeOrderPage(orderPagination.page + 1)}
                    disabled={orderPagination.page === orderPagination.pageCount}
                    className="pressable inline-flex min-h-10 items-center justify-center rounded-button border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ReportMetric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_42px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">{value}</p>
      <p className="mt-2 min-h-10 text-sm font-medium leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function ReportPanelTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">{icon}</span>
      <div>
        <h3 className="font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function ReportEmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 grid min-h-40 place-items-center rounded-[18px] border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
      {children}
    </div>
  );
}

function ReportLoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading report">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-36 animate-pulse rounded-[24px] border border-slate-200 bg-white" />
      ))}
    </div>
  );
}
