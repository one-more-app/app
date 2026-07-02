import {
  useHomeExercisesData,
  usePerformanceEntriesData,
} from "@/hooks/use-api-data";
import { getLatestPerformanceEntry } from "@/lib/performance-order";
import { getTrackedExerciseById } from "@/lib/storage";
import type { PerformanceEntry, TrackedExercise } from "@/types";
import { useMemo } from "react";

export type LatestGlobalPerf = {
  entry: PerformanceEntry;
  exercise: Pick<TrackedExercise, "id" | "name"> | null;
};

/**
 * Dernière performance loggée, tous exercices confondus + exo source résolu.
 *
 * Utilisé pour alimenter le compteur global de repos (RestSinceLastSetBar)
 * afin qu'il reste visible même quand l'utilisateur change d'exercice, et
 * permette de rouvrir l'exo source d'un tap.
 */
export function useLatestGlobalPerf(): LatestGlobalPerf | null {
  const { data: allEntries = [] } = usePerformanceEntriesData();
  const { data: homeExercises = [] } = useHomeExercisesData();

  return useMemo(() => {
    const active = allEntries.filter((e) => !e.deletedAt);
    const entry = getLatestPerformanceEntry(active);
    if (!entry) return null;

    const fromHome = homeExercises.find(
      (ex) => ex.id === entry.trackedExerciseId && !ex.deletedAt,
    );
    const fromStorage = fromHome
      ? null
      : getTrackedExerciseById(entry.trackedExerciseId);
    const source = fromHome ?? fromStorage;

    return {
      entry,
      exercise: source ? { id: source.id, name: source.name } : null,
    };
  }, [allEntries, homeExercises]);
}
