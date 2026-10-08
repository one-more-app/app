import type { FriendListItem } from "@/lib/social-api";
import { UI } from "@/lib/translations";
import type { FriendPresence } from "@/types";
import { daysWithoutActivitySince } from "@one-more/shared";

type SocialUserFields = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  avatarUrl: string | null;
  isPremium: boolean;
  isFriend: boolean;
};

/** Pote en séance en ce moment (présence temps réel). */
export type SocialTrainingNowItem = SocialUserFields & {
  exerciseName: string | null;
  /** Séance du jour du pote (lecture seule). */
  sessionPath: string;
};

/** Dernière séance d'un pote (date de dernière activité). */
export type SocialRecentSessionItem = SocialUserFields & {
  activityDate: string;
  sessionPath: string;
};

function toUserFields(friend: FriendListItem): SocialUserFields {
  return {
    userId: friend.userId,
    firstName: friend.firstName,
    lastName: friend.lastName,
    username: friend.username,
    avatarUrl: friend.avatarUrl,
    isPremium: friend.isPremium,
    isFriend: true,
  };
}

export function acceptedFriends(friends: FriendListItem[]): FriendListItem[] {
  return friends.filter((friend) => friend.status === "accepted");
}

/** Potes dont la présence est `training`, dans l'ordre de la liste d'amis. */
export function buildTrainingNowItems(
  friends: FriendListItem[],
  presenceByUserId: Map<string, FriendPresence>,
  todayKey: string,
): SocialTrainingNowItem[] {
  const items: SocialTrainingNowItem[] = [];
  for (const friend of acceptedFriends(friends)) {
    const presence = presenceByUserId.get(friend.userId);
    if (presence?.status !== "training") continue;
    items.push({
      ...toUserFields(friend),
      exerciseName: presence.exerciseName?.trim() || null,
      sessionPath: `/session/${friend.userId}/${todayKey}`,
    });
  }
  return items;
}

/** Potes avec une dernière séance connue, plus récente d'abord. */
export function buildRecentSessionItems(
  friends: FriendListItem[],
  limit = 5,
): SocialRecentSessionItem[] {
  return acceptedFriends(friends)
    .filter((friend) => Boolean(friend.lastActiveDate))
    .sort((a, b) => {
      const byDate = (b.lastActiveDate ?? "").localeCompare(
        a.lastActiveDate ?? "",
      );
      if (byDate !== 0) return byDate;
      return (a.firstName ?? a.username ?? "").localeCompare(
        b.firstName ?? b.username ?? "",
        "fr",
      );
    })
    .slice(0, limit)
    .map((friend) => ({
      ...toUserFields(friend),
      activityDate: friend.lastActiveDate!,
      sessionPath: `/session/${friend.userId}/${friend.lastActiveDate}`,
    }));
}

export function formatSocialSessionAgo(
  activityDate: string,
  todayKey: string,
): string {
  const days = daysWithoutActivitySince(activityDate, todayKey);
  if (days <= 0) return UI.socialSessionToday;
  if (days === 1) return UI.socialSessionYesterday;
  return UI.socialSessionDaysAgo.replace("{count}", String(days));
}
