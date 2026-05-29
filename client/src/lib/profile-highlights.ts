import { CARDIO_EQUIPMENT } from "@/lib/exercisedb";
import {
  getLeagueInfo,
  getLeagueLevelIndex,
  type LeagueInfo,
} from "@/lib/strength-standards";
import type {
  PerformanceEntry,
  TrackedExercise,
  UserProfile,
} from "@/types";

export type TopExerciseByLeague = {
  exercise: TrackedExercise;
  league: LeagueInfo;
  leagueScore: number;
  personalBest: PerformanceEntry;
};

export type MostTrainedExercise = {
  exercise: TrackedExercise;
  perfCount: number;
};

function isNonCardioTracked(ex: TrackedExercise): boolean {
  if ((ex.bodyPart || ex.target) === "cardio") return false;
  if (ex.equipment && CARDIO_EQUIPMENT.has(ex.equipment)) return false;
  return true;
}

function leagueRowForExercise(
  ex: TrackedExercise & { personalBest?: PerformanceEntry | null },
  profile: UserProfile,
): TopExerciseByLeague | null {
  if (ex.isCustom || !ex.personalBest || !isNonCardioTracked(ex)) return null;

  const meta =
    ex.equipment && ex.target
      ? {
          equipment: ex.equipment,
          target: ex.target,
          bodyPart: ex.bodyPart,
        }
      : undefined;

  const league = getLeagueInfo({
    weight: ex.personalBest.weight,
    reps: ex.personalBest.reps,
    bodyWeightKg: profile.weightKg,
    gender: profile.gender,
    exerciseName: ex.originalName ?? ex.name,
    exerciseMetadata: meta,
  });
  if (!league) return null;

  return {
    exercise: ex,
    league,
    leagueScore: getLeagueLevelIndex(league.level) + league.progressToNext,
    personalBest: ex.personalBest,
  };
}

export function getTopExercisesByLeague(
  exercises: (TrackedExercise & { personalBest?: PerformanceEntry | null })[],
  profile: UserProfile,
): TopExerciseByLeague[] {
  const rows: TopExerciseByLeague[] = [];
  for (const ex of exercises) {
    const row = leagueRowForExercise(ex, profile);
    if (row) rows.push(row);
  }
  rows.sort((a, b) => b.leagueScore - a.leagueScore);
  return rows;
}

export function getTopExerciseByLeague(
  exercises: (TrackedExercise & { personalBest?: PerformanceEntry | null })[],
  profile: UserProfile,
): TopExerciseByLeague | null {
  const list = getTopExercisesByLeague(exercises, profile);
  return list[0] ?? null;
}

export function getMostTrainedExercise(
  exercises: TrackedExercise[],
  performances: PerformanceEntry[],
): MostTrainedExercise | null {
  const counts = new Map<string, number>();
  for (const p of performances) {
    if (p.deletedAt) continue;
    counts.set(p.trackedExerciseId, (counts.get(p.trackedExerciseId) ?? 0) + 1);
  }

  let bestId: string | null = null;
  let bestCount = 0;
  for (const [id, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      bestId = id;
    }
  }

  if (!bestId || bestCount === 0) return null;
  const exercise = exercises.find((e) => e.id === bestId && !e.deletedAt);
  if (!exercise) return null;
  return { exercise, perfCount: bestCount };
}
