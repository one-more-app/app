import { CARDIO_EQUIPMENT } from "@/lib/exercisedb";
import {
  getLeagueInfo,
  getLeagueLevelIndex,
  inferTargetForLeague,
  leagueScoreToRepresentativeLevel,
  medianLeagueScore,
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
   * Score ligue médian sur ce muscle (indice 0–9 + progression vers le palier suivant).
   */
  representativeScore: number;
  /** Palier affiché (floor du score médian, sans arrondi au-dessus). */
  representativeLevel: LeagueLevel;
  exerciseCount: number;
  /** Exercices de ce muscle avec leur ligue (tri du palier le plus bas au plus élevé). */
  exercises: MuscleExerciseLeagueRow[];
}

export interface GlobalLeagueSummary {
  /** Score médian entre les groupes musculaires (chaque muscle compte autant). */
  globalRepresentativeScore: number;
  globalLevel: LeagueLevel;
  exerciseCount: number;
  /** Tri du plus faible au plus fort (score médian par muscle). */
  byMuscle: MuscleLeagueAgg[];
}

function isNonCardioTracked(ex: TrackedExercise): boolean {
  if ((ex.bodyPart || ex.target) === "cardio") return false;
  if (ex.equipment && CARDIO_EQUIPMENT.has(ex.equipment)) return false;
  return true;
}

function exerciseLeagueScore(league: LeagueInfo): number {
  return getLeagueLevelIndex(league.level) + league.progressToNext;
}

type ExerciseWithPb = TrackedExercise & { personalBest?: PerformanceEntry };

/**
 * Agrège tes ligues à partir des records (catalogue uniquement, exclut cardio et persos sans standards).
 * Palier global = médiane des médianes par muscle ; palier muscle = médiane des exos du muscle.
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

    rows.push({
      leagueScore: exerciseLeagueScore(league),
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
      const representativeScore = medianLeagueScore(leagueScores);
      const sortedExercises = [...exercises].sort(
        (a, b) =>
          exerciseLeagueScore(a.league) - exerciseLeagueScore(b.league),
      );
      return {
        target,
        representativeScore,
        representativeLevel:
          leagueScoreToRepresentativeLevel(representativeScore),
        exerciseCount: leagueScores.length,
        exercises: sortedExercises,
      };
    },
  );

  byMuscle.sort((a, b) => a.representativeScore - b.representativeScore);

  const muscleScores = byMuscle.map((m) => m.representativeScore);
  const globalRepresentativeScore = medianLeagueScore(muscleScores);
  const globalLevel = leagueScoreToRepresentativeLevel(globalRepresentativeScore);

  return {
    globalRepresentativeScore,
    globalLevel,
    exerciseCount: rows.length,
    byMuscle,
  };
}
