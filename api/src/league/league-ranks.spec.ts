import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  classifyExerciseRankCoverage,
  expandLegacyTiersToRankTiers,
  getAllTiers,
  getLeagueInfo,
  getRankIndex,
  isIntentionallyExcluded,
  RANK_ORDER,
} from '../../dist/shared/strength-standards.js';
import {
  computeLeagueStatsForTracked,
  leagueFromTrackedExercise,
} from '../../dist/shared/league-aggregate.js';

const DATA_DIR = join(process.cwd(), 'data');

function loadCatalog(file: string) {
  return JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8')) as Array<{
    id: string;
    name: string;
    equipment: string;
    target: string;
    bodyPart: string;
  }>;
}

function summarizeCoverage(exercises: ReturnType<typeof loadCatalog>) {
  const stats = { ok: 0, intentional: 0, gap: 0 };
  for (const ex of exercises) {
    const status = classifyExerciseRankCoverage(ex.name, {
      equipment: ex.equipment,
      target: ex.target,
      bodyPart: ex.bodyPart,
    });
    stats[status]++;
  }
  return stats;
}

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
      expect(ranks[i].ratio).toBeGreaterThanOrEqual(ranks[i - 1].ratio);
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

describe('new strength standard profiles', () => {
  const smokeCases: Array<{
    name: string;
    equipment: string;
    target: string;
  }> = [
    { name: 'cable standing crunch', equipment: 'cable', target: 'abs' },
    {
      name: 'lever preacher curl',
      equipment: 'leverage machine',
      target: 'biceps',
    },
    {
      name: 'lever seated calf press',
      equipment: 'leverage machine',
      target: 'calves',
    },
    { name: 'lever shrug', equipment: 'leverage machine', target: 'traps' },
    {
      name: 'lever back extension',
      equipment: 'leverage machine',
      target: 'spine',
    },
    { name: 'weighted crunch', equipment: 'weighted', target: 'abs' },
    { name: 'weighted pull-up', equipment: 'weighted', target: 'lats' },
    {
      name: 'lever seated hip abduction',
      equipment: 'leverage machine',
      target: 'abductors',
    },
    { name: 'smith leg press', equipment: 'smith machine', target: 'glutes' },
    {
      name: 'kettlebell hang clean',
      equipment: 'kettlebell',
      target: 'hamstrings',
    },
  ];

  it.each(smokeCases)(
    'returns tiers for $name',
    ({ name, equipment, target }) => {
      expect(
        getAllTiers(80, 'male', name, { equipment, target }),
      ).not.toBeNull();
      expect(
        getLeagueInfo({
          weight: 40,
          reps: 5,
          bodyWeightKg: 80,
          gender: 'male',
          exerciseName: name,
          exerciseMetadata: { equipment, target },
        }),
      ).not.toBeNull();
    },
  );
});

describe('isIntentionallyExcluded', () => {
  it('excludes pure bodyweight abs', () => {
    expect(isIntentionallyExcluded('body weight', 'abs', 'crunch floor')).toBe(
      true,
    );
  });

  it('allows loaded cable crunch', () => {
    expect(
      isIntentionallyExcluded('cable', 'abs', 'cable standing crunch'),
    ).toBe(false);
  });

  it('excludes cardio', () => {
    expect(
      isIntentionallyExcluded(
        'elliptical machine',
        'cardiovascular system',
        'run',
      ),
    ).toBe(true);
  });
});

describe('leagueFromTrackedExercise', () => {
  it('returns rank for leverage machine exercises with catalog metadata', () => {
    const league = leagueFromTrackedExercise(
      {
        id: 'test',
        name: 'Curl pupitre',
        originalName: 'lever preacher curl',
        equipment: 'leverage machine',
        target: 'biceps',
        isCustom: false,
        personalBest: { weight: 30, reps: 8 },
      },
      { weightKg: 80, gender: 'male' },
    );
    expect(league).not.toBeNull();
    expect(league!.rankId).toMatch(/^(bronze|silver|gold|platinum|diamond)_/);
  });

  it('returns rank for assisted pull-up with catalog metadata', () => {
    const league = leagueFromTrackedExercise(
      {
        id: 'test',
        name: 'Traction assistée',
        originalName: 'assisted pull-up',
        equipment: 'assisted',
        target: 'lats',
        isCustom: false,
        personalBest: { weight: 0, reps: 8 },
      },
      { weightKg: 80, gender: 'male' },
    );
    expect(league).not.toBeNull();
  });

  it('excludes true cardio leverage machines by target', () => {
    const league = leagueFromTrackedExercise(
      {
        id: 'test',
        name: 'Vélo',
        originalName: 'cycle cross trainer',
        equipment: 'leverage machine',
        target: 'cardiovascular system',
        isCustom: false,
        personalBest: { weight: 0, reps: 10 },
      },
      { weightKg: 80, gender: 'male' },
    );
    expect(league).toBeNull();
  });
});

describe('catalog rank coverage', () => {
  it('has zero fixable gaps in catalog', () => {
    const stats = summarizeCoverage(loadCatalog('popular-exercises.json'));
    expect(stats.gap).toBe(0);
    expect(stats.ok).toBeGreaterThan(1100);
    expect(stats.intentional).toBeGreaterThan(200);
  });

  it('keeps ranks for popular gym exercises', () => {
    const popular = [
      'barbell bench press',
      'barbell high bar squat',
      'barbell deadlift',
      'twin handle parallel grip lat pulldown',
      'barbell seated overhead press',
      'barbell bent over row',
      'dumbbell lateral raise',
      'lever leg extension',
      'smith leg press',
      'barbell curl',
      'cable one arm tricep pushdown',
      'dumbbell incline bench press',
      'dumbbell biceps curl',
      'pull-up',
      'cable seated row',
    ];
    const catalog = loadCatalog('popular-exercises.json');
    for (const name of popular) {
      const ex = catalog.find((e) => e.name === name);
      expect(ex).toBeDefined();
      expect(
        classifyExerciseRankCoverage(ex!.name, {
          equipment: ex!.equipment,
          target: ex!.target,
          bodyPart: ex!.bodyPart,
        }),
      ).toBe('ok');
    }
  });
});
