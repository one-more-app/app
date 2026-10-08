import { usePerformanceEntriesData } from "@/hooks/use-api-data";
import { useLocalPerformanceEntries } from "@/hooks/use-local-data-store";
import { useSessionTiming } from "@/hooks/use-session-timing";
import {
  getActivityDayKey,
  mergePerformanceEntriesById,
} from "@/lib/activity-from-performances";
import { getLocalDateKey } from "@/lib/local-date";
import { getLatestPerformanceEntry } from "@/lib/performance-order";
import type { PerformanceEntry } from "@/types";
import { useMemo } from "react";

export type LiveSession = {
  /** Clé jour locale (`YYYY-MM-DD`) de la séance. */
  dayKey: string;
  /** Perfs actives du jour. */
  entries: PerformanceEntry[];
  /** Début de la séance (ms epoch). */
  startedAtMs: number;
  setCount: number;
  exerciseCount: number;
  /** Dernière série du jour : définit l'exercice "en cours". */
  lastEntry: PerformanceEntry;
  /** Nombre de séries du jour sur l'exercice en cours. */
  currentExerciseSetCount: number;
};

/**
 * Séance du jour en cours (au moins une perf récente aujourd'hui), ou `null`.
 * Même définition que l'accueil (`computeSessionTiming().isInProgress`).
 */
export function useLiveSession(): LiveSession | null {
  const { data: remoteEntries } = usePerformanceEntriesData();
  const localEntries = useLocalPerformanceEntries();
  const dayKey = getLocalDateKey();

  const entries = useMemo(
    () =>
      mergePerformanceEntriesById(remoteEntries ?? [], localEntries).filter(
        (entry) => !entry.deletedAt && getActivityDayKey(entry) === dayKey,
      ),
    [remoteEntries, localEntries, dayKey],
  );

  const { timing } = useSessionTiming(entries, { dayKey });

  return useMemo(() => {
    if (!timing?.isInProgress) return null;
    const lastEntry = getLatestPerformanceEntry(entries);
    if (!lastEntry) return null;
    const exerciseIds = new Set(entries.map((e) => e.trackedExerciseId));
    return {
      dayKey,
      entries,
      startedAtMs: new Date(timing.startedAt).getTime(),
      setCount: entries.length,
      exerciseCount: exerciseIds.size,
      lastEntry,
      currentExerciseSetCount: entries.filter(
        (e) => e.trackedExerciseId === lastEntry.trackedExerciseId,
      ).length,
    };
  }, [timing, entries, dayKey]);
}
