/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/Popover";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useNotifications } from "@/hooks/useNotifications";
import { ICON_SIZE, ICON_STROKE_WIDTH } from "@/shared/constants/icons";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationsMenu() {
  const router = useRouter();
  const { fetchNotifications, markAsRead, loading } = useNotifications();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const result = await fetchNotifications({ limit: 5 });
      setItems(result.data ?? []);
      setUnreadCount(result.unreadCount ?? 0);
    } catch {
      /* surfaced via the dedicated notifications page, badge just stays stale */
    }
  }, [fetchNotifications]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSelect = async (item: NotificationItem) => {
    if (!item.is_read) {
      await markAsRead(item.id);
      load();
    }
    setOpen(false);
    if (item.action_url) router.push(item.action_url);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) load();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
        >
          <Bell className={ICON_SIZE.md} strokeWidth={ICON_STROKE_WIDTH} />
          {unreadCount > 0 && (
            <Badge
              variant="danger"
              size="sm"
              className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 leading-none"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="space-y-3 p-4">
              <Skeleton variant="text" className="w-3/4" />
              <Skeleton variant="text" className="w-1/2" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="You're all caught up"
              description="No notifications right now."
              className="p-6"
            />
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="flex w-full flex-col gap-0.5 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {!item.is_read && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                  {item.title}
                </span>
                <span className="line-clamp-2 text-xs text-muted-foreground">{item.message}</span>
                <span className="text-xs text-muted-foreground/70">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </span>
              </button>
            ))
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            router.push("/admin/notifications");
          }}
          className="block w-full border-t border-border px-4 py-2.5 text-center text-sm font-medium text-primary transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none"
        >
          View all notifications
        </button>
      </PopoverContent>
    </Popover>
  );
}
