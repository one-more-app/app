import { CARDIO_EQUIPMENT } from "@/lib/exercisedb";
import {
  averageLeagueScoreToLevel,
  getLeagueInfo,
  getLeagueLevelIndex,
  inferTargetForLeague,
  type LeagueInfo,
  type LeagueLevel,
} from "@/lib/strength-standards";
import type { PerformanceEntry, TrackedExercise, UserProfile } from "@/types";

export interface MuscleExerciseLeagueRow {
  trackedExerciseId: string;
  name: string;
  league: LeagueInfo;
}

export interface MuscleLeagueAgg {
  target: string;
  /**
   * Score ligue moyen : indice de palier (0 = Fer … 9 = Légende) + progression vers le suivant.
   */
  avgLeagueScore: number;
  /** Palier représentatif (arrondi du score moyen). */
  representativeLevel: LeagueLevel;
  exerciseCount: number;
  /** Exercices de ce muscle avec leur ligue (tri du palier le plus bas au plus élevé). */
  exercises: MuscleExerciseLeagueRow[];
}

export interface GlobalLeagueSummary {
  globalAvgLeagueScore: number;
  /** Ligue globale du corps (arrondi de la moyenne de tous les exos avec ligue). */
  globalLevel: LeagueLevel;
  exerciseCount: number;
  /** Tri du plus faible au plus fort (score moyen). */
  byMuscle: MuscleLeagueAgg[];
}

function isNonCardioTracked(ex: TrackedExercise): boolean {
  if ((ex.bodyPart || ex.target) === "cardio") return false;
  if (ex.equipment && CARDIO_EQUIPMENT.has(ex.equipment)) return false;
  return true;
}

type ExerciseWithPb = TrackedExercise & { personalBest?: PerformanceEntry };

/**
 * Agrège tes ligues à partir des records (catalogue uniquement, exclut cardio et persos sans standards).
 */
export function computeLeagueStatsForTracked(
  exercises: ExerciseWithPb[],
  profile: UserProfile,
): GlobalLeagueSummary | null {
  type Row = {
    leagueScore: number;
    target: string;
    exercise: MuscleExerciseLeagueRow;
  };
  const rows: Row[] = [];

  for (const ex of exercises) {
    if (ex.isCustom || !ex.personalBest) continue;
    if (!isNonCardioTracked(ex)) continue;

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
    if (!league) continue;

    const target = inferTargetForLeague(ex.originalName ?? ex.name, meta);
    if (!target) continue;

    const leagueScore = getLeagueLevelIndex(league.level) + league.progressToNext;
    rows.push({
      leagueScore,
      target,
      exercise: {
        trackedExerciseId: ex.id,
        name: ex.name,
        league,
      },
    });
  }

  if (rows.length === 0) return null;

  const globalAvgLeagueScore =
    rows.reduce((s, r) => s + r.leagueScore, 0) / rows.length;
  const globalLevel = averageLeagueScoreToLevel(globalAvgLeagueScore);

  const byTarget = new Map<string, { leagueScores: number[]; exercises: MuscleExerciseLeagueRow[] }>();
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
      const avgLeagueScore =
        leagueScores.reduce((a, b) => a + b, 0) / leagueScores.length;
      const sortedExercises = [...exercises].sort(
        (a, b) =>
          getLeagueLevelIndex(a.league.level) +
          a.league.progressToNext -
          (getLeagueLevelIndex(b.league.level) + b.league.progressToNext),
      );
      return {
        target,
        avgLeagueScore,
        representativeLevel: averageLeagueScoreToLevel(avgLeagueScore),
        exerciseCount: leagueScores.length,
        exercises: sortedExercises,
      };
    },
  );

  byMuscle.sort((a, b) => a.avgLeagueScore - b.avgLeagueScore);

  return {
    globalAvgLeagueScore,
    globalLevel,
    exerciseCount: rows.length,
    byMuscle,
  };
}
