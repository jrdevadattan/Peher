import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminNotifications,
  retryOrderNotifications,
} from "@/lib/admin-api";
import { supabase } from "@/lib/supabase";

export type NotificationConnectionState =
  | "disabled"
  | "connecting"
  | "live"
  | "retrying"
  | "offline";

export function useAdminNotifications(enabled: boolean) {
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] =
    useState<NotificationConnectionState>(enabled ? "connecting" : "disabled");
  const [subscriptionVersion, setSubscriptionVersion] = useState(0);

  const query = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: getAdminNotifications,
    enabled,
    retry: 5,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 30_000),
    refetchInterval: enabled ? 30_000 : false,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!enabled) {
      setConnectionState("disabled");
      return;
    }

    let disposed = false;
    let reconnectAttempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let channel = supabase.channel(`admin-order-notifications-${subscriptionVersion}`);

    const reconnect = () => {
      if (disposed) return;
      if (reconnectTimer) return;
      setConnectionState("retrying");
      const delay = Math.min(1_000 * 2 ** reconnectAttempt, 30_000);
      reconnectAttempt += 1;
      reconnectTimer = setTimeout(() => {
        if (!disposed) setSubscriptionVersion((version) => version + 1);
      }, delay);
    };

    setConnectionState("connecting");
    channel = channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_notifications",
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
          void queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
        },
      )
      .subscribe((status) => {
        if (disposed) return;
        if (status === "SUBSCRIBED") {
          reconnectAttempt = 0;
          setConnectionState("live");
          return;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          reconnect();
          return;
        }
        if (status === "CLOSED") setConnectionState("offline");
      });

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      void supabase.removeChannel(channel);
    };
  }, [enabled, queryClient, subscriptionVersion]);

  const retry = async () => {
    setConnectionState("retrying");
    try {
      const recovered = await retryOrderNotifications();
      await Promise.all([
        query.refetch(),
        queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
      ]);
      setSubscriptionVersion((version) => version + 1);
      return recovered;
    } catch (error) {
      setConnectionState("offline");
      throw error;
    }
  };

  return {
    ...query,
    notifications: query.data ?? [],
    unreadCount: (query.data ?? []).filter((notification) => !notification.isRead).length,
    connectionState,
    retry,
  };
}
