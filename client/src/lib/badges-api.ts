import { apiFetch } from "@/lib/api";

export type UserBadgeDto = {
  id: string;
  kind: string;
  tier: string;
  sourceKey: string;
  earnedAt: string;
  meta: Record<string, unknown>;
  deeplink: string | null;
};

export async function fetchMyBadges(): Promise<UserBadgeDto[]> {
  return apiFetch<UserBadgeDto[]>("/badges/me");
}

export async function fetchFriendBadges(
  userId: string,
): Promise<UserBadgeDto[]> {
  return apiFetch<UserBadgeDto[]>(
    `/badges/user/${encodeURIComponent(userId)}`,
  );
}
