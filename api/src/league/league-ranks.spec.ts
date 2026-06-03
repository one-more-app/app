import {
  expandLegacyTiersToRankTiers,
  getLeagueInfo,
  getRankIndex,
  RANK_ORDER,
} from '../../dist/shared/strength-standards.js';
import { computeLeagueStatsForTracked } from '../../dist/shared/league-aggregate.js';

describe('expandLegacyTiersToRankTiers', () => {
  const legacy = [
    { ratio: 0, label: 'Fer' },
    { ratio: 0.22, label: 'Bronze' },
    { ratio: 0.43, label: 'Argent' },
    { ratio: 0.65, label: 'Or' },
    { ratio: 0.87, label: 'Platine' },
    { ratio: 1.08, label: 'Émeraude' },
    { ratio: 1.3, label: 'Diamant' },
    { ratio: 1.52, label: 'Maître' },
    { ratio: 1.73, label: 'Elite' },
    { ratio: 1.95, label: 'Légende' },
  ];

  it('produces 16 monotonic rank thresholds', () => {
    const ranks = expandLegacyTiersToRankTiers(legacy);
    expect(ranks).toHaveLength(16);
    expect(ranks.map((r) => r.rankId)).toEqual([...RANK_ORDER]);
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]!.ratio).toBeGreaterThanOrEqual(ranks[i - 1]!.ratio);
    }
  });
});

describe('getLeagueInfo', () => {
  it('returns bronze_1 at low ratio', () => {
    const league = getLeagueInfo({
      weight: 20,
      reps: 8,
      bodyWeightKg: 80,
      gender: 'male',
      exerciseName: 'barbell bench press',
      exerciseMetadata: { equipment: 'barbell', target: 'pectorals' },
    });
    expect(league).not.toBeNull();
    expect(league!.tier).toBe('bronze');
    expect(league!.rankId.startsWith('bronze_')).toBe(true);
  });

  it('returns legend at very high ratio', () => {
    const league = getLeagueInfo({
      weight: 200,
      reps: 1,
      bodyWeightKg: 80,
      gender: 'male',
      exerciseName: 'barbell bench press',
      exerciseMetadata: { equipment: 'barbell', target: 'pectorals' },
    });
    expect(league?.rankId).toBe('legend');
    expect(league?.subRank).toBeNull();
  });
});

describe('computeLeagueStatsForTracked', () => {
  it('aggregates median global rank', () => {
    const summary = computeLeagueStatsForTracked(
      [
        {
          id: 'a',
          name: 'Bench',
          originalName: 'barbell bench press',
          equipment: 'barbell',
          target: 'pectorals',
          isCustom: false,
          personalBest: { weight: 60, reps: 5 },
        },
      ],
      { weightKg: 80, gender: 'male' },
    );
    expect(summary).not.toBeNull();
    expect(summary!.exerciseCount).toBe(1);
    expect(getRankIndex(summary!.globalRank)).toBeGreaterThanOrEqual(0);
  });
});
