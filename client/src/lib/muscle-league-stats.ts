import { exerciseZone } from "@/lib/exercise-catalog-browse";
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

export interface ZoneLeagueAgg {
  zone: string;
  /** Score ligue médian des exos classés dans cette zone. */
  representativeScore: number;
  representativeLevel: LeagueLevel;
  exerciseCount: number;
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

export interface BrowseLeagueLookups {
  byZone: Map<string, LeagueLevel>;
  /** zone → muscle → palier médian */
  targetInZone: Map<string, Map<string, LeagueLevel>>;
  /** `zone|target|equipment` → palier médian */
  equipmentInPath: Map<string, LeagueLevel>;
}

export function browseEquipmentLeagueKey(
  zone: string,
  target: string,
  equipment: string,
): string {
  return `${zone.toLowerCase()}|${target.toLowerCase()}|${equipment.toLowerCase()}`;
}

function scoresToLevelMap(scoresByKey: Map<string, number[]>): Map<string, LeagueLevel> {
  const out = new Map<string, LeagueLevel>();
  for (const [key, scores] of scoresByKey) {
    if (scores.length === 0) continue;
    out.set(key, leagueScoreToRepresentativeLevel(medianLeagueScore(scores)));
  }
  return out;
}

function collectBrowseLeagueScores(
  exercises: ExerciseWithPb[],
  profile: UserProfile,
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
    if (ex.isCustom || !ex.personalBest) continue;
    if (!isNonCardioTracked(ex)) continue;

    const zone = exerciseZone(ex);
    if (!zone) continue;

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

    const score = exerciseLeagueScore(league);
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

/** Paliers médians pour le parcours imbriqué (zone → muscle → matériel). */
export function computeBrowseLeagueLookups(
  exercises: ExerciseWithPb[],
  profile: UserProfile,
): BrowseLeagueLookups {
  const { byZone, targetInZone, equipmentInPath } = collectBrowseLeagueScores(
    exercises,
    profile,
  );

  const targetLevels = new Map<string, Map<string, LeagueLevel>>();
  for (const [zone, scoresByTarget] of targetInZone) {
    targetLevels.set(zone, scoresToLevelMap(scoresByTarget));
  }

  return {
    byZone: scoresToLevelMap(byZone),
    targetInZone: targetLevels,
    equipmentInPath: scoresToLevelMap(equipmentInPath),
  };
}

/**
 * Palier par zone du corps (médiane des scores ligue des exos suivis dans la zone).
 * Même logique que {@link computeLeagueStatsForTracked} au niveau muscle, regroupé par zone.
 */
export function computeZoneLeagueStatsForTracked(
  exercises: ExerciseWithPb[],
  profile: UserProfile,
): Map<string, ZoneLeagueAgg> {
  const { byZone } = collectBrowseLeagueScores(exercises, profile);
  const out = new Map<string, ZoneLeagueAgg>();
  for (const [zone, leagueScores] of byZone) {
    const representativeScore = medianLeagueScore(leagueScores);
    out.set(zone, {
      zone,
      representativeScore,
      representativeLevel:
        leagueScoreToRepresentativeLevel(representativeScore),
      exerciseCount: leagueScores.length,
    });
  }
  return out;
}
