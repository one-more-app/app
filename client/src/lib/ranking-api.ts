import { apiFetch } from "@/lib/api";

export type RankingEntryDto = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  avatarUrl: string | null;
  xp: number;
  rank: number;
  /** RankId (ex. "gold_2") ou null */
  globalRank: string | null;
  isPremium: boolean;
};

export type RankingListResponse = {
  month: string;
  entries: RankingEntryDto[];
  /** Nombre total de participants (avant plafonnement de la liste). */
  total?: number;
  me: { userId: string; xp: number; rank: number; globalRank: string | null };
  meta?: {
    rankingOptIn?: boolean;
    hasGym?: boolean;
    placeName?: string | null;
    placeAddress?: string | null;
    placeId?: string | null;
    /** Classement d’une autre salle (via badge / deeplink). */
    foreignGym?: boolean;
  };
};

export type RankingRecapResponse = {
  month: string;
  xp: number;
  activeDays: number;
  friends: { rank: number; total: number } | null;
  gym: { rank: number; total: number } | null;
  badge?: { kind: string; tier: string; deeplink: string | null } | null;
};

export type RankingTab = "friends" | "gym";

export async function fetchFriendsRanking(
  month: string,
  options: { lite?: boolean } = {},
): Promise<RankingListResponse> {
  const lite = options.lite ? "&lite=1" : "";
  return apiFetch<RankingListResponse>(
    `/ranking/friends?month=${encodeURIComponent(month)}${lite}`,
  );
}

export async function fetchGymRanking(
  month: string,
  options: { placeId?: string | null } = {},
): Promise<RankingListResponse> {
  const params = new URLSearchParams({ month });
  if (options.placeId?.trim()) {
    params.set("placeId", options.placeId.trim());
  }
  return apiFetch<RankingListResponse>(`/ranking/gym?${params.toString()}`);
}

export async function fetchRankingRecap(
  month: string,
): Promise<RankingRecapResponse> {
  return apiFetch<RankingRecapResponse>(
    `/ranking/me/recap?month=${encodeURIComponent(month)}`,
  );
}
