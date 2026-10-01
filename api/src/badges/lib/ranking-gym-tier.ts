import type { RankingGymBadgeTier } from '../entities/user-badge.entity.js';

export function rankingGymTierFromRank(
  rank: number,
): RankingGymBadgeTier | null {
  if (rank < 1) return null;
  if (rank === 1) return 'top1';
  if (rank <= 3) return 'top3';
  if (rank <= 10) return 'top10';
  if (rank <= 50) return 'top50';
  return null;
}

export function rankingGymDeeplink(month: string): string {
  return `/ranking?tab=gym&month=${encodeURIComponent(month)}`;
}
