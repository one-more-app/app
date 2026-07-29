import {
  fetchNotificationFeed,
  markNotificationsRead,
  NOTIFICATION_FEED_SWR_KEY,
  type NotificationFeedItem,
  type NotificationFeedResponse,
} from "@/lib/notifications-api";
import { useCallback } from "react";
import useSWR from "swr";

const EMPTY_FEED: NotificationFeedResponse = {
  items: [],
  unreadCount: 0,
};

export function useNotificationFeed() {
  const { data, error, isLoading, mutate } = useSWR(
    NOTIFICATION_FEED_SWR_KEY,
    fetchNotificationFeed,
    { revalidateOnFocus: true },
  );

  const feed = data ?? EMPTY_FEED;

  const markRead = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      await mutate(
        async (current) => {
          const result = await markNotificationsRead(ids);
          const idSet = new Set(ids);
          const now = new Date().toISOString();
          const base = current ?? EMPTY_FEED;
          return {
            items: base.items.map((item) =>
              idSet.has(item.id) && !item.readAt
                ? { ...item, readAt: now }
                : item,
            ),
            unreadCount: result.unreadCount,
          };
        },
        { revalidate: false },
      );
    },
    [mutate],
  );

  const markAllRead = useCallback(async () => {
    await mutate(
      async (current) => {
        const result = await markNotificationsRead();
        const now = new Date().toISOString();
        const base = current ?? EMPTY_FEED;
        return {
          items: base.items.map((item) =>
            item.readAt ? item : { ...item, readAt: now },
          ),
          unreadCount: result.unreadCount,
        };
      },
      { revalidate: false },
    );
  }, [mutate]);

  return {
    items: feed.items as NotificationFeedItem[],
    unreadCount: feed.unreadCount,
    isLoading,
    error,
    mutate,
    markRead,
    markAllRead,
  };
}
