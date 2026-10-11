import {
  buildSessionFeedItems,
  type SessionFeedItem,
} from "@/lib/session-feed";
import { fetchDaySessions } from "@/lib/session-api";
import useSWR from "swr";

export function sessionsFeedSwrKey(
  ownerUserId: string,
  dayKeys: string[],
) {
  return ["sessions-feed", ownerUserId, ...dayKeys] as const;
}

export function useSessionsFeed(
  ownerUserId: string | undefined,
  dayKeys: string[],
  enabled = true,
) {
  const key =
    enabled && ownerUserId && dayKeys.length > 0
      ? sessionsFeedSwrKey(ownerUserId, dayKeys)
      : null;

  return useSWR<SessionFeedItem[]>(key, async () => {
    const results = await Promise.all(
      dayKeys.map(async (dayKey) => {
        try {
          const { items } = await fetchDaySessions(ownerUserId!, dayKey);
          return { dayKey, items };
        } catch {
          // Un jour en erreur ne bloque pas le feed.
          return { dayKey, items: [] as Awaited<
            ReturnType<typeof fetchDaySessions>
          >["items"] };
        }
      }),
    );
    return buildSessionFeedItems(results);
  });
}
