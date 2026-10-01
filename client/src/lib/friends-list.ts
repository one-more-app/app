import { getProfileDisplayName } from "@/lib/profile-display";
import type { FriendListItem } from "@/lib/social-api";
import { getLocalDateKey } from "@/lib/local-date";
import { UI } from "@/lib/translations";
import { daysWithoutActivitySince } from "@one-more/shared";

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

function messageTimestamp(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ts = new Date(iso).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function lastActiveTimestamp(date: string | null | undefined): number {
  if (!date) return 0;
  const ts = Date.parse(`${date}T00:00:00.000Z`);
  return Number.isNaN(ts) ? 0 : ts;
}

/**
 * Tri liste amis unifiée : dernier message desc, sinon dernière séance desc,
 * puis nom alphabétique FR.
 */
export function compareFriendsByRecentActivity(
  a: FriendListItem,
  b: FriendListItem,
  lastMessageAtByUserId: Map<string, string | null | undefined>,
): number {
  const aMsg = messageTimestamp(lastMessageAtByUserId.get(a.userId));
  const bMsg = messageTimestamp(lastMessageAtByUserId.get(b.userId));
  const aHasMsg = aMsg > 0;
  const bHasMsg = bMsg > 0;

  if (aHasMsg && bHasMsg) {
    if (bMsg !== aMsg) return bMsg - aMsg;
    return friendDisplayName(a).localeCompare(friendDisplayName(b), "fr");
  }
  if (aHasMsg !== bHasMsg) return aHasMsg ? -1 : 1;

  const aActive = lastActiveTimestamp(a.lastActiveDate);
  const bActive = lastActiveTimestamp(b.lastActiveDate);
  if (bActive !== aActive) return bActive - aActive;

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
