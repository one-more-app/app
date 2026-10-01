import { apiFetch } from "@/lib/api";

export type RankingEntryDto = {
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  xp: number;
  rank: number;
  /** RankId (ex. "gold_2") ou null */
  globalRank: string | null;
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
  };
};

export type RankingRecapResponse = {
  month: string;
  xp: number;
  activeDays: number;
  friends: { rank: number; total: number } | null;
  gym: { rank: number; total: number } | null;
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
): Promise<RankingListResponse> {
  return apiFetch<RankingListResponse>(
    `/ranking/gym?month=${encodeURIComponent(month)}`,
  );
}

export async function fetchRankingRecap(
  month: string,
): Promise<RankingRecapResponse> {
  return apiFetch<RankingRecapResponse>(
    `/ranking/me/recap?month=${encodeURIComponent(month)}`,
  );
}
