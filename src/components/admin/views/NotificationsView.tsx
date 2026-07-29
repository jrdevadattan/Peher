import { useState } from "react";
import {
  BellRing,
  CheckCheck,
  RefreshCw,
  ShoppingBag,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { AdminNotification } from "@/lib/admin-api";
import type { NotificationConnectionState } from "@/lib/use-admin-notifications";
import { AdminCardListSkeleton } from "@/components/loading-skeletons";

type NotificationsViewProps = {
  notifications: AdminNotification[];
  isLoading: boolean;
  error: Error | null;
  connectionState: NotificationConnectionState;
  onOpen: (notification: AdminNotification) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onRetry: () => Promise<number>;
};

const connectionCopy: Record<NotificationConnectionState, string> = {
  disabled: "Unavailable",
  connecting: "Connecting",
  live: "Live",
  retrying: "Retrying",
  offline: "Polling fallback",
};

export function NotificationsView({
  notifications,
  isLoading,
  error,
  connectionState,
  onOpen,
  onMarkAllRead,
  onRetry,
}: NotificationsViewProps) {
  const [busy, setBusy] = useState(false);
  const [retryMessage, setRetryMessage] = useState("");
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const handleRetry = async () => {
    setBusy(true);
    setRetryMessage("");
    try {
      const recovered = await onRetry();
      setRetryMessage(
        recovered
          ? `${recovered} missing ${recovered === 1 ? "notification was" : "notifications were"} recovered.`
          : "Notification history is fully synchronized.",
      );
    } catch (retryError) {
      setRetryMessage(
        retryError instanceof Error
          ? retryError.message
          : "Notification synchronization failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl tracking-tight md:text-4xl">
              Order Notifications
            </h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${
                connectionState === "live"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {connectionState === "live" ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {connectionCopy[connectionState]}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            New orders arrive through Supabase Realtime with automatic polling and retry fallback.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void onMarkAllRead()}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition hover:bg-muted disabled:opacity-40"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
          <button
            onClick={() => void handleRetry()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#D8E7D2] hover:text-black disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
            {busy ? "Synchronizing" : "Retry sync"}
          </button>
        </div>
      </div>

      {(error || retryMessage) && (
        <div
          className={`rounded-lg border p-3 text-xs ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-[#D8E7D2] bg-[#D8E7D2]/20 text-foreground"
          }`}
        >
          {error ? "Notifications could not be loaded. Retry sync will try again." : retryMessage}
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <AdminCardListSkeleton count={5} />
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <BellRing className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-4 font-serif text-2xl">No order notifications yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The next completed order will appear here automatically.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => void onOpen(notification)}
              className={`flex w-full items-start gap-4 rounded-xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                notification.isRead
                  ? "border-border bg-card"
                  : "border-[#D8E7D2] bg-[#D8E7D2]/15"
              }`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-900 text-white">
                <ShoppingBag className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-serif text-lg font-semibold">{notification.title}</span>
                  <time className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {notification.message}
                </span>
                {!notification.isRead && (
                  <span className="mt-3 inline-block rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                    New
                  </span>
                )}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
