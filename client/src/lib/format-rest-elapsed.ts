export const REST_SINCE_LAST_SET_MAX_MS = 10 * 60 * 1000;

/** Format gym `m:ss` (ex. 0:45, 2:15, 9:59). */
export function formatRestElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Libellé accessible en français (ex. « 2 minutes 15 »). */
export function formatRestElapsedA11y(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return seconds <= 1 ? "1 seconde" : `${seconds} secondes`;
  }
  if (seconds === 0) {
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  }
  const minLabel = minutes === 1 ? "1 minute" : `${minutes} minutes`;
  const secLabel = seconds === 1 ? "1 seconde" : `${seconds} secondes`;
  return `${minLabel} ${secLabel}`;
}

export function getRestElapsedMs(
  createdAt: string | null | undefined,
  now = Date.now(),
): number | null {
  if (!createdAt) return null;
  const start = new Date(createdAt).getTime();
  if (Number.isNaN(start)) return null;
  return Math.max(0, now - start);
}

export function isRestSinceLastSetVisible(
  createdAt: string | null | undefined,
  now = Date.now(),
  maxMs = REST_SINCE_LAST_SET_MAX_MS,
): boolean {
  const elapsed = getRestElapsedMs(createdAt, now);
  if (elapsed == null) return false;
  return elapsed < maxMs;
}

export function getRestProgress01(
  elapsedMs: number,
  maxMs = REST_SINCE_LAST_SET_MAX_MS,
): number {
  if (maxMs <= 0) return 1;
  return Math.min(1, Math.max(0, elapsedMs / maxMs));
}
