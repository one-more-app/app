import { exerciseZone } from "./exercise-zone.js";
import {
  getLeagueInfo,
  getRankIndex,
  inferTargetForLeague,
  medianRankScore,
  rankScore,
  rankScoreToRepresentativeRank,
  type ExerciseMetadata,
  type LeagueInfo,
  type RankId,
} from "./strength-standards.js";

export const CARDIO_EQUIPMENT = new Set([
  "stationary bike",
  "stepmill machine",
  "elliptical machine",
  "skierg machine",
  "upper body ergometer",
  "rope",
]);

export type LeagueProfileInput = {
  weightKg: number;
  gender: "male" | "female";
};

export type TrackedExerciseLeagueInput = {
  id: string;
  name: string;
  originalName?: string | null;
  bodyPart?: string | null;
  target?: string | null;
  equipment?: string | null;
  isCustom: boolean;
  personalBest?: { weight: number; reps: number } | null;
};

export interface MuscleExerciseLeagueRow {
  trackedExerciseId: string;
  name: string;
  league: LeagueInfo;
}

export interface MuscleLeagueAgg {
  target: string;
  representativeScore: number;
  representativeRank: RankId;
  exerciseCount: number;
  exercises: MuscleExerciseLeagueRow[];
}

export interface ZoneLeagueAgg {
  zone: string;
  representativeScore: number;
  representativeRank: RankId;
  exerciseCount: number;
}

export interface GlobalLeagueSummary {
  globalRepresentativeScore: number;
  globalRank: RankId;
  exerciseCount: number;
  byMuscle: MuscleLeagueAgg[];
}

export type TopExerciseByLeague = {
  trackedExerciseId: string;
  name: string;
  league: LeagueInfo;
  leagueScore: number;
  personalBest: { weight: number; reps: number };
};

function isNonCardioTracked(ex: TrackedExerciseLeagueInput): boolean {
  if ((ex.bodyPart || ex.target) === "cardio") return false;
  if (ex.equipment && CARDIO_EQUIPMENT.has(ex.equipment)) return false;
  return true;
}

function exerciseMetadata(ex: TrackedExerciseLeagueInput): ExerciseMetadata | undefined {
  if (ex.equipment && ex.target) {
    return {
      equipment: ex.equipment,
      target: ex.target,
      bodyPart: ex.bodyPart ?? undefined,
    };
  }
  return undefined;
}

export function leagueFromTrackedExercise(
  ex: TrackedExerciseLeagueInput,
  profile: LeagueProfileInput,
): LeagueInfo | null {
  if (ex.isCustom || !ex.personalBest) return null;
  if (!isNonCardioTracked(ex)) return null;
  if (!profile.weightKg || profile.weightKg <= 0) return null;

  return getLeagueInfo({
    weight: ex.personalBest.weight,
    reps: ex.personalBest.reps,
    bodyWeightKg: profile.weightKg,
    gender: profile.gender,
    exerciseName: ex.originalName ?? ex.name,
    exerciseMetadata: exerciseMetadata(ex),
  });
}

export function computeLeagueStatsForTracked(
  exercises: TrackedExerciseLeagueInput[],
  profile: LeagueProfileInput,
): GlobalLeagueSummary | null {
  type Row = {
    leagueScore: number;
    target: string;
    exercise: MuscleExerciseLeagueRow;
  };
  const rows: Row[] = [];

  for (const ex of exercises) {
    const league = leagueFromTrackedExercise(ex, profile);
    if (!league) continue;

    const target = inferTargetForLeague(
      ex.originalName ?? ex.name,
      exerciseMetadata(ex),
    );
    if (!target) continue;

    rows.push({
      leagueScore: rankScore(league),
      target,
      exercise: {
        trackedExerciseId: ex.id,
        name: ex.name,
        league,
      },
    });
  }

  if (rows.length === 0) return null;

  const byTarget = new Map<
    string,
    { leagueScores: number[]; exercises: MuscleExerciseLeagueRow[] }
  >();
  for (const r of rows) {
    if (!byTarget.has(r.target)) {
      byTarget.set(r.target, { leagueScores: [], exercises: [] });
    }
    const bucket = byTarget.get(r.target)!;
    bucket.leagueScores.push(r.leagueScore);
    bucket.exercises.push(r.exercise);
  }

  const byMuscle: MuscleLeagueAgg[] = Array.from(byTarget.entries()).map(
    ([target, { leagueScores, exercises }]) => {
      const representativeScore = medianRankScore(leagueScores);
      const sortedExercises = [...exercises].sort(
        (a, b) => rankScore(a.league) - rankScore(b.league),
      );
      return {
        target,
        representativeScore,
        representativeRank: rankScoreToRepresentativeRank(representativeScore),
        exerciseCount: leagueScores.length,
        exercises: sortedExercises,
      };
    },
  );

  byMuscle.sort((a, b) => a.representativeScore - b.representativeScore);

  const muscleScores = byMuscle.map((m) => m.representativeScore);
  const globalRepresentativeScore = medianRankScore(muscleScores);
  const globalRank = rankScoreToRepresentativeRank(globalRepresentativeScore);

  return {
    globalRepresentativeScore,
    globalRank,
    exerciseCount: rows.length,
    byMuscle,
  };
}

export function getTopExercisesByLeague(
  exercises: TrackedExerciseLeagueInput[],
  profile: LeagueProfileInput,
): TopExerciseByLeague[] {
  const rows: TopExerciseByLeague[] = [];
  for (const ex of exercises) {
    const league = leagueFromTrackedExercise(ex, profile);
    if (!league || !ex.personalBest) continue;
    rows.push({
      trackedExerciseId: ex.id,
      name: ex.name,
      league,
      leagueScore: rankScore(league),
      personalBest: ex.personalBest,
    });
  }
  rows.sort((a, b) => b.leagueScore - a.leagueScore);
  return rows;
}

export function getTopExerciseByLeague(
  exercises: TrackedExerciseLeagueInput[],
  profile: LeagueProfileInput,
): TopExerciseByLeague | null {
  return getTopExercisesByLeague(exercises, profile)[0] ?? null;
}

export interface BrowseLeagueLookups {
  byZone: Record<string, RankId>;
  targetInZone: Record<string, Record<string, RankId>>;
  equipmentInPath: Record<string, RankId>;
}

export function browseEquipmentLeagueKey(
  zone: string,
  target: string,
  equipment: string,
): string {
  return `${zone.toLowerCase()}|${target.toLowerCase()}|${equipment.toLowerCase()}`;
}

function scoresToRankMap(scoresByKey: Map<string, number[]>): Record<string, RankId> {
  const out: Record<string, RankId> = {};
  for (const [key, scores] of scoresByKey) {
    if (scores.length === 0) continue;
    out[key] = rankScoreToRepresentativeRank(medianRankScore(scores));
  }
  return out;
}

function collectBrowseLeagueScores(
  exercises: TrackedExerciseLeagueInput[],
  profile: LeagueProfileInput,
): {
  byZone: Map<string, number[]>;
  targetInZone: Map<string, Map<string, number[]>>;
  equipmentInPath: Map<string, number[]>;
} {
  const byZone = new Map<string, number[]>();
  const targetInZone = new Map<string, Map<string, number[]>>();
  const equipmentInPath = new Map<string, number[]>();

  const push = (map: Map<string, number[]>, key: string, score: number) => {
    const bucket = map.get(key) ?? [];
    bucket.push(score);
    map.set(key, bucket);
  };

  for (const ex of exercises) {
    const league = leagueFromTrackedExercise(ex, profile);
    if (!league) continue;

    const zone = exerciseZone(ex);
    if (!zone) continue;

    const score = rankScore(league);
    const z = zone.toLowerCase();
    const t = (ex.target ?? "").toLowerCase();
    const eq = (ex.equipment ?? "").toLowerCase();

    push(byZone, z, score);
    if (t) {
      if (!targetInZone.has(z)) targetInZone.set(z, new Map());
      push(targetInZone.get(z)!, t, score);
    }
    if (t && eq) {
      push(equipmentInPath, browseEquipmentLeagueKey(z, t, eq), score);
    }
  }

  return { byZone, targetInZone, equipmentInPath };
}

export function computeBrowseLeagueLookups(
  exercises: TrackedExerciseLeagueInput[],
  profile: LeagueProfileInput,
): BrowseLeagueLookups {
  const { byZone, targetInZone, equipmentInPath } = collectBrowseLeagueScores(
    exercises,
    profile,
  );

  const targetRanks: Record<string, Record<string, RankId>> = {};
  for (const [zone, scoresByTarget] of targetInZone) {
    targetRanks[zone] = scoresToRankMap(scoresByTarget);
  }

  return {
    byZone: scoresToRankMap(byZone),
    targetInZone: targetRanks,
    equipmentInPath: scoresToRankMap(equipmentInPath),
  };
}

export function computeZoneLeagueStatsForTracked(
  exercises: TrackedExerciseLeagueInput[],
  profile: LeagueProfileInput,
): Record<string, ZoneLeagueAgg> {
  const { byZone } = collectBrowseLeagueScores(exercises, profile);
  const out: Record<string, ZoneLeagueAgg> = {};
  for (const [zone, leagueScores] of byZone) {
    const representativeScore = medianRankScore(leagueScores);
    out[zone] = {
      zone,
      representativeScore,
      representativeRank: rankScoreToRepresentativeRank(representativeScore),
      exerciseCount: leagueScores.length,
    };
  }
  return out;
}

export function didRankPromote(
  before: LeagueInfo | null,
  after: LeagueInfo | null,
): boolean {
  if (!after) return false;
  if (!before) return true;
  return getRankIndex(after.rankId) > getRankIndex(before.rankId);
}
