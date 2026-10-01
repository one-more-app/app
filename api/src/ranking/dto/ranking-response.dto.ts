export type RankingEntryDto = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  avatarUrl: string | null;
  xp: number;
  rank: number;
  globalRank: string | null; // RankId or null
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
  };
};

export type RankingRecapBadgeDto = {
  kind: string;
  tier: string;
  deeplink: string | null;
};

export type RankingRecapResponse = {
  month: string;
  xp: number;
  activeDays: number;
  friends: { rank: number; total: number } | null;
  gym: { rank: number; total: number } | null;
  /** Badge gagné pour ce mois (ex. ranking_gym), si éligible. */
  badge?: RankingRecapBadgeDto | null;
};
