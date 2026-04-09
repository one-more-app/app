import {
  getLastPerformance,
  getPersonalBest,
  getTrackedExercises,
  removeTrackedExercise,
} from "@/lib/storage";
import type { PerformanceEntry, TrackedExercise } from "@/types";
import { useCallback, useEffect, useState } from "react";

export interface ExerciseWithPerf extends TrackedExercise {
  lastPerf: PerformanceEntry | undefined;
  personalBest: PerformanceEntry | undefined;
}

export function useHomeData() {
  const [exercisesWithPerf, setExercisesWithPerf] = useState<
    ExerciseWithPerf[]
  >([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const load = useCallback(() => {
    const tracked = getTrackedExercises();
    const withPerf: ExerciseWithPerf[] = tracked.map((ex) => ({
      ...ex,
      lastPerf: getLastPerformance(ex.id),
      personalBest: getPersonalBest(ex.id),
    }));
    setExercisesWithPerf(withPerf);
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    // Diffère vers une micro-tâche pour éviter certains warnings lint
    // (setState déclenché depuis un effet).
    void Promise.resolve().then(load);
  }, [load]);

  useEffect(() => {
    // Recharger après une synchro (push + pull) qui modifie localStorage.
    const onSynced = () => load();
    window.addEventListener("one-more:synced", onSynced);
    return () => window.removeEventListener("one-more:synced", onSynced);
  }, [load]);

  const removeExercise = useCallback(
    (id: string) => {
      removeTrackedExercise(id);
      load();
    },
    [load],
  );

  return {
    exercises: exercisesWithPerf,
    hasLoaded,
    removeExercise,
    refresh: load,
  };
}
