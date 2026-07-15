"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient as createRawSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import {
  fetchBrowserSnapshot,
  fetchOrders,
  fetchStaffRequests,
  fetchTables
} from "@/services/browser-restaurant-service";
import {
  sanitizeKitchenClientSnapshot,
  type KitchenClientSnapshot
} from "@/lib/kitchen-client-snapshot";
import type { RestaurantSnapshot } from "@/services/restaurant-service";

type RefreshKind = "all" | "orders" | "requests" | "tables";

type RealtimeSnapshotShape = Omit<RestaurantSnapshot, "settings"> & {
  settings: object;
};

type BrowserRestaurantSnapshot = Awaited<ReturnType<typeof fetchBrowserSnapshot>>;

type SnapshotMapper<TSnapshot extends RealtimeSnapshotShape> = (
  snapshot: BrowserRestaurantSnapshot
) => TSnapshot;

type PartialSnapshotUpdates = {
  orders: RestaurantSnapshot["orders"] | null;
  staffRequests: RestaurantSnapshot["staffRequests"] | null;
  tables: RestaurantSnapshot["tables"] | null;
};

export function mapIncomingRestaurantSnapshot<TSnapshot extends RealtimeSnapshotShape>(
  snapshot: BrowserRestaurantSnapshot,
  mapSnapshot: SnapshotMapper<TSnapshot>
) {
  return mapSnapshot(snapshot);
}

export function mergeRestaurantSnapshotUpdates<TSnapshot extends RealtimeSnapshotShape>(
  current: TSnapshot,
  updates: PartialSnapshotUpdates
) {
  return {
    ...current,
    ...(updates.orders ? { orders: updates.orders } : {}),
    ...(updates.staffRequests ? { staffRequests: updates.staffRequests } : {}),
    ...(updates.tables ? { tables: updates.tables } : {})
  };
}

function useMappedRestaurantRealtime<TSnapshot extends RealtimeSnapshotShape>(
  initialSnapshot: TSnapshot,
  mapSnapshot: SnapshotMapper<TSnapshot>
) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<TSnapshot>(initialSnapshot);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(!isSupabaseConfigured());
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const postCommitRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orderFallbackRefreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingRefreshKindsRef = useRef<Set<RefreshKind>>(new Set());
  const postCommitRefreshKindsRef = useRef<Set<RefreshKind>>(new Set());
  const refreshingRef = useRef(false);
  const mountedRef = useRef(false);
  const channelNameRef = useRef(`restaurant-ops-${Math.random().toString(36).slice(2)}`);

  const flushPendingRefreshes = useCallback(async () => {
    if (!isSupabaseConfigured()) return;

    if (refreshingRef.current) {
      return;
    }

    if (pendingRefreshKindsRef.current.size === 0) return;

    refreshingRef.current = true;
    setIsRefreshing(true);
    let refreshFailed = false;
    try {
      while (pendingRefreshKindsRef.current.size > 0) {
        const pendingKinds = new Set(pendingRefreshKindsRef.current);
        pendingRefreshKindsRef.current.clear();

        if (pendingKinds.has("all")) {
          const nextSnapshot = await fetchBrowserSnapshot();
          if (mountedRef.current) {
            setSnapshot(mapIncomingRestaurantSnapshot(nextSnapshot, mapSnapshot));
          }
          continue;
        }

        const [orders, staffRequests, tables] = await Promise.all([
          pendingKinds.has("orders") ? fetchOrders() : Promise.resolve(null),
          pendingKinds.has("requests") ? fetchStaffRequests() : Promise.resolve(null),
          pendingKinds.has("tables") ? fetchTables() : Promise.resolve(null)
        ]);

        if (mountedRef.current) {
          setSnapshot((current) =>
            mergeRestaurantSnapshotUpdates(current, { orders, staffRequests, tables })
          );
        }
      }

      if (mountedRef.current) setSyncError(null);
    } catch {
      refreshFailed = true;
      if (mountedRef.current) {
        setSyncError("Could not sync the latest restaurant data. Retrying...");
        router.refresh();
      }
    } finally {
      refreshingRef.current = false;
      if (mountedRef.current) setIsRefreshing(false);

      if (!refreshFailed && pendingRefreshKindsRef.current.size > 0) {
        setTimeout(() => {
          void flushPendingRefreshes();
        }, 0);
      }
    }
  }, [mapSnapshot, router]);

  const runRefresh = useCallback(async (kind: RefreshKind) => {
    if (!isSupabaseConfigured()) return;
    pendingRefreshKindsRef.current.add(kind);
    await flushPendingRefreshes();
  }, [flushPendingRefreshes]);

  const scheduleRefresh = useCallback(
    (kind: RefreshKind) => {
      if (!isSupabaseConfigured()) return;
      pendingRefreshKindsRef.current.add(kind);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        refreshTimerRef.current = null;
        void flushPendingRefreshes();
      }, 250);
    },
    [flushPendingRefreshes]
  );

  const schedulePostCommitRefresh = useCallback(
    (kind: RefreshKind) => {
      if (!isSupabaseConfigured()) return;
      postCommitRefreshKindsRef.current.add(kind);

      if (postCommitRefreshTimerRef.current) clearTimeout(postCommitRefreshTimerRef.current);
      postCommitRefreshTimerRef.current = setTimeout(() => {
        postCommitRefreshTimerRef.current = null;
        postCommitRefreshKindsRef.current.forEach((pendingKind) => {
          pendingRefreshKindsRef.current.add(pendingKind);
        });
        postCommitRefreshKindsRef.current.clear();
        void flushPendingRefreshes();
      }, 1000);
    },
    [flushPendingRefreshes]
  );

  const stopOrderFallbackRefresh = useCallback(() => {
    if (!orderFallbackRefreshTimerRef.current) return;
    clearInterval(orderFallbackRefreshTimerRef.current);
    orderFallbackRefreshTimerRef.current = null;
  }, []);

  const startOrderFallbackRefresh = useCallback(() => {
    if (orderFallbackRefreshTimerRef.current) return;
    scheduleRefresh("orders");
    orderFallbackRefreshTimerRef.current = setInterval(() => {
      scheduleRefresh("orders");
    }, 3000);
  }, [scheduleRefresh]);

  const handleRealtimeEvent = useCallback(
    (kind: RefreshKind) => {
      scheduleRefresh(kind);
      schedulePostCommitRefresh(kind);
    },
    [schedulePostCommitRefresh, scheduleRefresh]
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
      if (postCommitRefreshTimerRef.current) clearTimeout(postCommitRefreshTimerRef.current);
      if (orderFallbackRefreshTimerRef.current) clearInterval(orderFallbackRefreshTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setSnapshot(initialSnapshot);
  }, [initialSnapshot]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setIsRealtimeConnected(false);
      setSyncError("Realtime is not configured for this environment.");
      return;
    }

    const supabase = createRawSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    const subscriptions: Array<{ table: string; kind: RefreshKind }> = [
      { table: "orders", kind: "orders" },
      { table: "order_items", kind: "orders" },
      { table: "staff_requests", kind: "requests" },
      { table: "tables", kind: "tables" }
    ];

    const channels = subscriptions.map(({ table, kind }) => {
      const channelName = `${channelNameRef.current}-${table}`;

      return supabase
        .channel(channelName)
        .on("postgres_changes", { event: "*", schema: "public", table }, () =>
          handleRealtimeEvent(kind)
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            if (table === "orders") stopOrderFallbackRefresh();
            setIsRealtimeConnected(true);
            setSyncError(null);
            scheduleRefresh("all");
          }

          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            if (table === "orders") startOrderFallbackRefresh();
            setIsRealtimeConnected(false);
            setSyncError("Realtime connection paused. The dashboard will resync automatically.");
          }
        });
    });

    return () => {
      channels.forEach((channel) => {
        void supabase.removeChannel(channel);
      });
    };
  }, [handleRealtimeEvent, scheduleRefresh, startOrderFallbackRefresh, stopOrderFallbackRefresh]);

  return {
    snapshot,
    isRefreshing,
    syncError,
    isRealtimeConnected,
    refreshAll,
    refreshOrders,
    refreshRequests,
    refreshTables
  };
}

export function useRestaurantRealtime(initialSnapshot: RestaurantSnapshot) {
  const clientInitialSnapshot = useMemo(
    () => sanitizeKitchenClientSnapshot(initialSnapshot),
    [initialSnapshot]
  );

  return useMappedRestaurantRealtime(
    clientInitialSnapshot,
    sanitizeKitchenClientSnapshot
  );
}

export function useKitchenRestaurantRealtime(initialSnapshot: KitchenClientSnapshot) {
  return useMappedRestaurantRealtime(initialSnapshot, sanitizeKitchenClientSnapshot);
}
