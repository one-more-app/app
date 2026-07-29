import { getProfileDisplayName } from "@/lib/profile-display";
import type { FriendListItem } from "@/lib/social-api";
import { getLocalDateKey } from "@/lib/local-date";
import { UI } from "@/lib/translations";
import type { FriendPresence, PresenceStatus } from "@/types";
import { daysWithoutActivitySince } from "@one-more/shared";

function presenceSortRank(status: PresenceStatus | undefined): number {
  if (status === "training") return 0;
  if (status === "online") return 1;
  return 2;
}

function heartbeatTimestamp(presence: FriendPresence | undefined): number {
  if (!presence?.lastHeartbeatAt) return 0;
  const ts = new Date(presence.lastHeartbeatAt).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function friendDisplayName(item: FriendListItem): string {
  return getProfileDisplayName(
    {
      firstName: item.firstName ?? undefined,
      lastName: item.lastName ?? undefined,
      username: item.username ?? undefined,
    },
    null,
  );
}

export function compareFriendsByPresence(
  a: FriendListItem,
  b: FriendListItem,
  presenceByUserId: Map<string, FriendPresence>,
): number {
  const aPresence = presenceByUserId.get(a.userId);
  const bPresence = presenceByUserId.get(b.userId);
  const rankDiff =
    presenceSortRank(aPresence?.status) - presenceSortRank(bPresence?.status);
  if (rankDiff !== 0) return rankDiff;

  const heartbeatDiff =
    heartbeatTimestamp(bPresence) - heartbeatTimestamp(aPresence);
  if (heartbeatDiff !== 0) return heartbeatDiff;

  return friendDisplayName(a).localeCompare(friendDisplayName(b), "fr");
}

export function formatFriendLastSessionAgo(
  lastActiveDate: string | null | undefined,
): string | null {
  if (!lastActiveDate) return null;
  const days = daysWithoutActivitySince(lastActiveDate, getLocalDateKey());
  if (days === 0) return UI.friendLastSessionToday;
  if (days === 1) return UI.friendLastSessionYesterday;
  return UI.friendLastSessionDaysAgo.replace("{count}", String(days));
}
