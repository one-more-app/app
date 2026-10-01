export type RankingEntryDto = {
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  xp: number;
  rank: number;
  globalRank: string | null; // RankId or null
};

export type RankingListResponse = {
  month: string;
  entries: RankingEntryDto[];
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
