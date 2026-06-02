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
  // On privilégie toujours `date` si elle est exploitable, même si elle n'est
  // pas strictement au format YYYY-MM-DD (ex: YYYY-MM-DDTHH:mm:ssZ).
  const directDay = entry.date.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (directDay) {
    return directDay === dayKey;
  }

  if (entry.date) {
    const parsedDate = new Date(entry.date);
    if (!Number.isNaN(parsedDate.getTime())) {
      return getLocalDateKey(parsedDate) === dayKey;
    }
  }

  // Fallback historique pour les anciennes entrées sans champ `date` fiable.
  const createdKey = getLocalDateKey(new Date(entry.createdAt));
  return createdKey === dayKey;
}
