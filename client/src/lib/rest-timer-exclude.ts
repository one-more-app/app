const REST_TIMER_EXCLUDED_ENTRY_IDS_KEY =
  "one-more-rest-timer-excluded-entry-ids-v1";

let excludedEntryIds = loadExcludedEntryIds();

function loadExcludedEntryIds(): Set<string> {
  if (typeof sessionStorage === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(REST_TIMER_EXCLUDED_ENTRY_IDS_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((id): id is string => typeof id === "string" && id.length > 0),
    );
  } catch {
    return new Set();
  }
}

function persistExcludedEntryIds(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      REST_TIMER_EXCLUDED_ENTRY_IDS_KEY,
      JSON.stringify([...excludedEntryIds]),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

/** Première perf d'onboarding : consulter la fiche, sans lancer le chrono. */
export function excludePerformanceFromRestTimer(entryId: string): void {
  if (!entryId) return;
  excludedEntryIds.add(entryId);
  persistExcludedEntryIds();
}

export function isPerformanceExcludedFromRestTimer(entryId: string): boolean {
  return excludedEntryIds.has(entryId);
}

export function clearRestTimerExcludedPerformances(): void {
  excludedEntryIds = new Set();
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(REST_TIMER_EXCLUDED_ENTRY_IDS_KEY);
  } catch {
    /* ignore */
  }
}
