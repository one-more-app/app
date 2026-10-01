import { describe, expect, it } from '@jest/globals';
import {
  rankingGymDeeplink,
  rankingGymTierFromRank,
} from '../lib/ranking-gym-tier.js';

describe('rankingGymTierFromRank', () => {
  it('maps ranks to tiers', () => {
    expect(rankingGymTierFromRank(1)).toBe('top1');
    expect(rankingGymTierFromRank(2)).toBe('top3');
    expect(rankingGymTierFromRank(3)).toBe('top3');
    expect(rankingGymTierFromRank(4)).toBe('top10');
    expect(rankingGymTierFromRank(10)).toBe('top10');
    expect(rankingGymTierFromRank(11)).toBe('top50');
    expect(rankingGymTierFromRank(50)).toBe('top50');
  });

  it('returns null outside Top 50', () => {
    expect(rankingGymTierFromRank(0)).toBeNull();
    expect(rankingGymTierFromRank(51)).toBeNull();
  });
});

describe('rankingGymDeeplink', () => {
  it('points to gym tab for the month', () => {
    expect(rankingGymDeeplink('2026-09')).toBe(
      '/ranking?tab=gym&month=2026-09',
    );
  });
});
