import type { PerformanceEntry } from "@/types";

/** Clé jour locale `YYYY-MM-DD` (pas UTC). */
export function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Une perf compte pour le jour local (champ `date` ou `createdAt`). */
export function isPerformanceOnLocalDay(
  entry: PerformanceEntry,
  dayKey = getLocalDateKey(),
): boolean {
  // Si `date` est canonique (YYYY-MM-DD), on ne doit PAS retomber sur `createdAt`.
  // Sinon des perfs anciennes peuvent apparaître "aujourd'hui" après remap/sync.
  if (/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    return entry.date === dayKey;
  }
  const createdKey = getLocalDateKey(new Date(entry.createdAt));
  return createdKey === dayKey;
}
