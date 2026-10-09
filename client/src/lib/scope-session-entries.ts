import type { PerformanceEntry } from "@/types";

/** Perfs de cette séance ; fallback jour si aucune n'a encore de workoutSessionId. */
export function scopeDayEntriesToSession(
  dayEntries: PerformanceEntry[],
  sessionId: string,
): PerformanceEntry[] {
  const scoped = dayEntries.filter(
    (entry) => entry.workoutSessionId === sessionId,
  );
  if (scoped.length > 0) return scoped;
  const anyTagged = dayEntries.some((entry) => entry.workoutSessionId);
  return anyTagged ? [] : dayEntries;
}
