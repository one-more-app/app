import { useAuth } from "@/hooks/use-auth";
import { usePerformanceEntriesData } from "@/hooks/use-api-data";
import {
  pickPrimaryDaySession,
  useDaySessions,
} from "@/hooks/use-day-sessions";
import { useLocalPerformanceEntries } from "@/hooks/use-local-data-store";
import { useSessionTiming } from "@/hooks/use-session-timing";
import {
  getActivityDayKey,
  mergePerformanceEntriesById,
} from "@/lib/activity-from-performances";
import { readStoredSession } from "@/lib/auth";
import { getLocalDateKey } from "@/lib/local-date";
import { getLatestPerformanceEntry } from "@/lib/performance-order";
import { scopeDayEntriesToSession } from "@/lib/scope-session-entries";
import type { PerformanceEntry } from "@/types";
import { useMemo } from "react";

export type LiveSession = {
  /** Clé jour locale (`YYYY-MM-DD`) de la séance. */
  dayKey: string;
  /** Id séance first-class si connu. */
  sessionId: string | null;
  /** Perfs actives de la séance (ou du jour en fallback). */
  entries: PerformanceEntry[];
  /** Début de la séance (ms epoch). */
  startedAtMs: number;
  setCount: number;
  exerciseCount: number;
  /** Dernière série : définit l'exercice "en cours". */
  lastEntry: PerformanceEntry;
  /** Nombre de séries sur l'exercice en cours. */
  currentExerciseSetCount: number;
};

/**
 * Séance du jour en cours, ou `null` si terminée / absente.
 * Scoppée sur la séance live first-class (pas tout le jour).
 */
export function useLiveSession(): LiveSession | null {
  const auth = useAuth();
  const ownerUserId =
    (auth.status === "authenticated" ? auth.user?.id : undefined) ??
    readStoredSession()?.user.id;
  const { data: remoteEntries } = usePerformanceEntriesData();
  const localEntries = useLocalPerformanceEntries();
  const dayKey = getLocalDateKey();

  const dayEntries = useMemo(
    () =>
      mergePerformanceEntriesById(remoteEntries ?? [], localEntries).filter(
        (entry) => !entry.deletedAt && getActivityDayKey(entry) === dayKey,
      ),
    [remoteEntries, localEntries, dayKey],
  );

  const { data: dayList } = useDaySessions(
    ownerUserId,
    dayKey,
    dayEntries.length > 0,
  );

  const liveSummary = useMemo(() => {
    const items = dayList?.items ?? [];
    const live = items.find((item) => item.isLive);
    if (dayList != null) return live ?? null;
    return pickPrimaryDaySession(items);
  }, [dayList]);

  const sessionId = liveSummary?.id ?? null;

  const entries = useMemo(() => {
    if (dayList != null && !liveSummary) return [];
    if (!sessionId) return dayEntries;
    return scopeDayEntriesToSession(dayEntries, sessionId);
  }, [dayEntries, sessionId, dayList, liveSummary]);

  const endedAt = liveSummary?.endedAt ?? null;
  const { timing } = useSessionTiming(entries, {
    dayKey,
    endedAt,
    isPresenceTraining: liveSummary?.isLive,
  });

  return useMemo(() => {
    if (dayList != null && !liveSummary) return null;
    if (!timing?.isInProgress) return null;
    const lastEntry = getLatestPerformanceEntry(entries);
    if (!lastEntry) return null;
    const exerciseIds = new Set(entries.map((e) => e.trackedExerciseId));
    return {
      dayKey,
      sessionId: lastEntry.workoutSessionId ?? sessionId,
      entries,
      startedAtMs: new Date(timing.startedAt).getTime(),
      setCount: entries.length,
      exerciseCount: exerciseIds.size,
      lastEntry,
      currentExerciseSetCount: entries.filter(
        (e) => e.trackedExerciseId === lastEntry.trackedExerciseId,
      ).length,
    };
  }, [dayList, liveSummary, timing, entries, dayKey, sessionId]);
}
