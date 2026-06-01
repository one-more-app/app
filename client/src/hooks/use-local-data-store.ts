import { getUserProgress } from "@/lib/progress-cache";
import { getPerformanceEntries } from "@/lib/storage";
import type { PerformanceEntry, UserProgressState } from "@/types";
import { useSyncExternalStore } from "react";

const DEFAULT_PROGRESS: UserProgressState = {
  totalXp: 0,
  level: 1,
  xpIntoLevel: 0,
  xpForNextLevel: 100,
  streak: { current: 0, longest: 0 },
  recentGrants: [],
};

function subscribeLocalData(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener("one-more:local-data-changed", handler);
  return () => window.removeEventListener("one-more:local-data-changed", handler);
}

/**
 * Perfs actives du cache local, réactives aux enregistrements immédiats.
 * `getPerformanceEntries` renvoie une référence stable (voir storage.ts).
 */
export function useLocalPerformanceEntries(): PerformanceEntry[] {
  return useSyncExternalStore(
    subscribeLocalData,
    getPerformanceEntries,
    () => EMPTY_PERFORMANCES,
  );
}

const EMPTY_PERFORMANCES: PerformanceEntry[] = [];

/** Progression XP / série du cache local, réactive après une perf. */
export function useLocalUserProgress(): UserProgressState {
  return useSyncExternalStore(
    subscribeLocalData,
    getUserProgress,
    () => DEFAULT_PROGRESS,
  );
}
