import type { PerformanceEntry, TrackedExercise } from "@/types";
import type { TopExerciseByLeague } from "@/lib/league-types";

export type MostTrainedExercise = {
  exercise: TrackedExercise;
  perfCount: number;
};

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

export function topExerciseToHighlight(
  row: TopExerciseByLeague,
  exercises: TrackedExercise[],
): {
  exercise: TrackedExercise;
  league: TopExerciseByLeague["league"];
  leagueScore: number;
  personalBest: PerformanceEntry;
} | null {
  const exercise = exercises.find((e) => e.id === row.trackedExerciseId);
  if (!exercise) return null;
  return {
    exercise,
    league: row.league,
    leagueScore: row.leagueScore,
    personalBest: {
      id: "",
      trackedExerciseId: row.trackedExerciseId,
      date: "",
      weight: row.personalBest.weight,
      reps: row.personalBest.reps,
      createdAt: "",
      updatedAt: "",
      deletedAt: null,
    },
  };
}
