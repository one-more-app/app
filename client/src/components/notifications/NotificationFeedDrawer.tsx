import { NotificationBellButton } from "@/components/notifications/NotificationBellButton";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { useNotificationFeed } from "@/hooks/use-notification-feed";
import { hapticImpact } from "@/lib/haptics";
import type { NotificationFeedItem } from "@/lib/notifications-api";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

function formatRelativeSentAt(iso: string): string {
  const sent = new Date(iso).getTime();
  if (Number.isNaN(sent)) return "";
  const diffMs = Math.max(0, Date.now() - sent);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return UI.notificationsJustNow;
  if (minutes < 60) {
    return UI.notificationsMinutesAgo.replace("{count}", String(minutes));
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return UI.notificationsHoursAgo.replace("{count}", String(hours));
  }
  const days = Math.floor(hours / 24);
  return UI.notificationsDaysAgo.replace("{count}", String(days));
}

function NotificationFeedItemRow({
  item,
  onSelect,
}: {
  item: NotificationFeedItem;
  onSelect: (item: NotificationFeedItem) => void;
}) {
  const unread = !item.readAt;
  const relative = formatRelativeSentAt(item.sentAt);

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3.5 text-left outline-none transition-colors",
        "hover:bg-muted/80 active:bg-muted",
        "focus-visible:bg-muted focus-visible:ring-0",
        unread ? "bg-muted/40" : undefined,
      )}
    >
      <span
        className={cn(
          "mt-1.5 size-1.5 shrink-0 rounded-full",
          unread
            ? "bg-primary dark:bg-primary-foreground"
            : "bg-transparent",
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="flex items-baseline justify-between gap-3">
          <span
            className={cn(
              "min-w-0 truncate text-sm leading-snug",
              unread
                ? "font-semibold text-foreground"
                : "font-medium text-muted-foreground",
            )}
          >
            {item.title}
          </span>
          {relative ? (
            <span
              className={cn(
                "shrink-0 text-[11px] tabular-nums",
                unread ? "text-muted-foreground" : "text-muted-foreground/70",
              )}
            >
              {relative}
            </span>
          ) : null}
        </span>
        {item.body ? (
          <span
            className={cn(
              "line-clamp-2 text-xs leading-relaxed",
              unread
                ? "text-muted-foreground"
                : "text-muted-foreground/70",
            )}
          >
            {item.body}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function NotificationFeedControl() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { items, unreadCount, mutate, markRead, markAllRead } =
    useNotificationFeed();

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) void mutate();
    },
    [mutate],
  );

  const handleSelect = useCallback(
    async (item: NotificationFeedItem) => {
      void hapticImpact();
      if (!item.readAt) {
        void markRead([item.id]);
      }
      setOpen(false);
      if (item.route) {
        navigate(item.route);
      }
    },
    [markRead, navigate],
  );

  const handleMarkAll = useCallback(async () => {
    void hapticImpact();
    await markAllRead();
  }, [markAllRead]);

  return (
    <>
      <NotificationBellButton
        unreadCount={unreadCount}
        onClick={() => handleOpenChange(true)}
      />
      <Drawer
        open={open}
        onOpenChange={handleOpenChange}
        direction="right"
        data-analytics-label="notification_feed"
      >
        <DrawerContent
          className={cn(
            "h-full max-h-none w-[min(22rem,100%)] rounded-none border-l border-border bg-card",
            "pt-[var(--safe-top)] pb-[var(--safe-bottom)] pr-[var(--safe-right)]",
          )}
        >
          <DrawerHeader className="gap-1 border-b border-border px-4 pb-3 text-left md:text-left">
            <div className="flex items-center justify-between gap-3">
              <DrawerTitle>{UI.notificationsFeedTitle}</DrawerTitle>
              {unreadCount > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto shrink-0 px-0 py-0 text-xs font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                  onClick={() => void handleMarkAll()}
                >
                  {UI.notificationsMarkAllRead}
                </Button>
              ) : null}
            </div>
            <DrawerDescription className="sr-only">
              {UI.notificationsFeedTitle}
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <EmptyState
                variant="plain"
                icon={Bell}
                title={UI.notificationsEmpty}
                className="px-4 py-14"
              />
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.id}>
                    <NotificationFeedItemRow
                      item={item}
                      onSelect={(row) => void handleSelect(row)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
