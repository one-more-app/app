import { FRIENDS_PRESENCE_SWR_KEY } from "@/hooks/use-realtime";
import { fetchFriendsPresence } from "@/lib/presence-api";
import type { FriendPresence, PresenceStatus } from "@/types";
import useSWR from "swr";

export function useFriendsPresence() {
  const { data, mutate, isLoading } = useSWR(FRIENDS_PRESENCE_SWR_KEY, async () =>
    fetchFriendsPresence(),
  );

  const byUserId = new Map<string, FriendPresence>(
    (data?.items ?? []).map((p) => [p.userId, p]),
  );

  return {
    isLoading,
    refresh: mutate,
    byUserId,
    trainingFriends: (data?.items ?? []).filter(
      (p) => p.status === "training",
    ),
  };
}

export function getPresenceLabel(
  presence: FriendPresence | undefined,
): string | null {
  if (!presence) return null;
  if (presence.status === "training") {
    return presence.exerciseName
      ? `${presence.exerciseName}`
      : "S'entraîne";
  }
  if (presence.status === "online") return "En ligne";
  return null;
}

export function presenceDotClass(status: PresenceStatus | undefined): string {
  if (status === "training") return "bg-amber-500 animate-pulse";
  if (status === "online") return "bg-emerald-500";
  return "bg-muted-foreground/30";
}
