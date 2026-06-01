import { getLocalDateKey, isPerformanceOnLocalDay } from "@/lib/local-date";
import { getEntriesByTrackedId } from "@/lib/storage";

export { getLocalDateKey as getTodayDateKey } from "@/lib/local-date";

/** Exercices suivis avec au moins une perf enregistrée aujourd'hui (jour local). */
export function filterExercisesDoneToday<T extends { id: string }>(
  exercises: T[],
  dayKey = getLocalDateKey(),
): T[] {
  return exercises.filter((ex) =>
    getEntriesByTrackedId(ex.id).some((e) => isPerformanceOnLocalDay(e, dayKey)),
  );
}
