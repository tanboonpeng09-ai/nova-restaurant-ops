"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import {
  fetchBrowserSnapshot,
  fetchOrders,
  fetchStaffRequests,
  fetchTables
} from "@/services/browser-restaurant-service";
import type { RestaurantSnapshot } from "@/services/restaurant-service";

type RefreshKind = "all" | "orders" | "requests" | "tables";

export function useRestaurantRealtime(initialSnapshot: RestaurantSnapshot) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(!isSupabaseConfigured());
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshingRef = useRef(false);
  const mountedRef = useRef(false);

  const runRefresh = useCallback(async (kind: RefreshKind) => {
    if (!isSupabaseConfigured() || refreshingRef.current) return;

    refreshingRef.current = true;
    setIsRefreshing(true);
    try {
      if (kind === "all") {
        const nextSnapshot = await fetchBrowserSnapshot();
        if (mountedRef.current) setSnapshot(nextSnapshot);
      }

      if (kind === "orders") {
        const orders = await fetchOrders();
        if (mountedRef.current) setSnapshot((current) => ({ ...current, orders }));
      }

      if (kind === "requests") {
        const staffRequests = await fetchStaffRequests();
        if (mountedRef.current) setSnapshot((current) => ({ ...current, staffRequests }));
      }

      if (kind === "tables") {
        const tables = await fetchTables();
        if (mountedRef.current) setSnapshot((current) => ({ ...current, tables }));
      }

      if (mountedRef.current) setSyncError(null);
    } catch {
      if (mountedRef.current) setSyncError("Could not sync the latest restaurant data. Retrying...");
    } finally {
      refreshingRef.current = false;
      if (mountedRef.current) setIsRefreshing(false);
    }
  }, []);

  const scheduleRefresh = useCallback(
    (kind: RefreshKind) => {
      if (!isSupabaseConfigured()) return;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        void runRefresh(kind);
      }, 250);
    },
    [runRefresh]
  );

  const refreshAll = useCallback(async () => {
    await runRefresh("all");
  }, [runRefresh]);

  const refreshOrders = useCallback(async () => {
    await runRefresh("orders");
  }, [runRefresh]);

  const refreshRequests = useCallback(async () => {
    await runRefresh("requests");
  }, [runRefresh]);

  const refreshTables = useCallback(async () => {
    await runRefresh("tables");
  }, [runRefresh]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setSnapshot(initialSnapshot);
  }, [initialSnapshot]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    const channel = supabase
      .channel("restaurant-ops")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => scheduleRefresh("orders"))
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => scheduleRefresh("orders"))
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_requests" }, () => scheduleRefresh("requests"))
      .on("postgres_changes", { event: "*", schema: "public", table: "tables" }, () => scheduleRefresh("tables"))
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_categories" }, () => scheduleRefresh("all"))
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => scheduleRefresh("all"))
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_settings" }, () => scheduleRefresh("all"))
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsRealtimeConnected(true);
          setSyncError(null);
          scheduleRefresh("all");
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setIsRealtimeConnected(false);
          setSyncError("Realtime connection paused. The dashboard will resync automatically.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [scheduleRefresh]);

  return {
    snapshot,
    setSnapshot,
    isRefreshing,
    syncError,
    isRealtimeConnected,
    refreshAll,
    refreshOrders,
    refreshRequests,
    refreshTables
  };
}
