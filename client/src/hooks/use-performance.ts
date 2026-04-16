import {
  deletePerformanceAndWait as deleteFromStorageAndWait,
  savePerformanceAndWait as saveToStorageAndWait,
  updatePerformanceAndWait as updateInStorageAndWait,
} from "@/lib/storage";
import {
  usePerformanceDataRefresh,
  usePerformanceEntriesData,
} from "@/hooks/use-api-data";
import type { PerformanceEntry } from "@/types";
import { useCallback, useMemo } from "react";

export function usePerformance(trackedExerciseId: string | null) {
  const { data: allEntries = [] } = usePerformanceEntriesData();
  const refreshAfterPerfChange = usePerformanceDataRefresh();

  const entries = useMemo<PerformanceEntry[]>(() => {
    if (!trackedExerciseId) return [];
    return allEntries
      .filter(
        (e) => !e.deletedAt && e.trackedExerciseId === trackedExerciseId,
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allEntries, trackedExerciseId]);

  const lastPerf = entries[entries.length - 1];

  const personalBest = useMemo(() => {
    if (entries.length === 0) return undefined;
    return entries.reduce((best, curr) =>
      curr.weight > best.weight ||
      (curr.weight === best.weight && curr.reps > best.reps)
        ? curr
        : best,
    );
  }, [entries]);

  const savePerformance = useCallback(
    (weight: number, reps: number, opts?: { date?: string }) => {
      if (!trackedExerciseId) return;
      void (async () => {
        try {
          await saveToStorageAndWait(trackedExerciseId, weight, reps, opts);
        } finally {
          void refreshAfterPerfChange();
        }
      })();
    },
    [refreshAfterPerfChange, trackedExerciseId],
  );

  const deletePerformance = useCallback(
    (entryId: string) => {
      void (async () => {
        try {
          await deleteFromStorageAndWait(entryId);
        } finally {
          void refreshAfterPerfChange();
        }
      })();
    },
    [refreshAfterPerfChange],
  );

  const updatePerformance = useCallback(
    (entryId: string, weight: number, reps: number) => {
      void (async () => {
        try {
          await updateInStorageAndWait(entryId, weight, reps);
        } finally {
          void refreshAfterPerfChange();
        }
      })();
    },
    [refreshAfterPerfChange],
  );

  return {
    entries,
    lastPerf,
    personalBest,
    savePerformance,
    deletePerformance,
    updatePerformance,
    refresh: () => void refreshAfterPerfChange(),
  };
}
