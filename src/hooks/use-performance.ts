import {
  deletePerformance as deleteFromStorage,
  getEntriesByTrackedId,
  getLastPerformance,
  getPersonalBest,
  savePerformance as saveToStorage,
  updatePerformance as updateInStorage,
} from "@/lib/storage";
import type { PerformanceEntry } from "@/types";
import { useCallback, useEffect, useState } from "react";

export function usePerformance(trackedExerciseId: string | null) {
  const [entries, setEntries] = useState<PerformanceEntry[]>([]);
  const [lastPerf, setLastPerf] = useState<PerformanceEntry | undefined>();
  const [personalBest, setPersonalBest] = useState<
    PerformanceEntry | undefined
  >();

  const load = useCallback(() => {
    if (!trackedExerciseId) {
      setEntries([]);
      setLastPerf(undefined);
      setPersonalBest(undefined);
      return;
    }
    const e = getEntriesByTrackedId(trackedExerciseId);
    setEntries(e);
    setLastPerf(getLastPerformance(trackedExerciseId));
    setPersonalBest(getPersonalBest(trackedExerciseId));
  }, [trackedExerciseId]);

  useEffect(() => {
    // Diffère vers une micro-tâche pour éviter certains warnings lint
    void Promise.resolve().then(load);
  }, [load]);

  useEffect(() => {
    // Les perfs peuvent changer après un sync (push + pull).
    // On recharge donc automatiquement.
    const onSynced = () => load();
    window.addEventListener("one-more:synced", onSynced);
    return () => window.removeEventListener("one-more:synced", onSynced);
  }, [load]);

  const savePerformance = useCallback(
    (weight: number, reps: number) => {
      if (!trackedExerciseId) return;
      saveToStorage(trackedExerciseId, weight, reps);
      load();
    },
    [trackedExerciseId, load],
  );

  const deletePerformance = useCallback(
    (entryId: string) => {
      deleteFromStorage(entryId);
      load();
    },
    [load],
  );

  const updatePerformance = useCallback(
    (entryId: string, weight: number, reps: number) => {
      updateInStorage(entryId, weight, reps);
      load();
    },
    [load],
  );

  return {
    entries,
    lastPerf,
    personalBest,
    savePerformance,
    deletePerformance,
    updatePerformance,
    refresh: load,
  };
}
