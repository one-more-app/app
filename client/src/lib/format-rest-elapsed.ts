/** Durée max d'affichage de la barre repos (masquage auto). */
export const REST_SINCE_LAST_SET_MAX_MS = 10 * 60 * 1000;

/** Durée cible de repos par défaut (1 min 30). */
export const DEFAULT_REST_TARGET_MS = 90 * 1000;

export const REST_TARGET_MIN_MS = 30 * 1000;
export const REST_TARGET_MAX_MS = 5 * 60 * 1000;

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
  targetMs = DEFAULT_REST_TARGET_MS,
): number {
  if (targetMs <= 0) return 1;
  return Math.min(1, Math.max(0, elapsedMs / targetMs));
}

export function isRestTargetComplete(
  elapsedMs: number,
  targetMs = DEFAULT_REST_TARGET_MS,
): boolean {
  return elapsedMs >= targetMs;
}

export function clampRestTargetMs(ms: number): number {
  return Math.min(
    REST_TARGET_MAX_MS,
    Math.max(REST_TARGET_MIN_MS, Math.round(ms)),
  );
}

export function msToRestTargetParts(ms: number): {
  minutes: number;
  seconds: number;
} {
  const totalSeconds = Math.round(clampRestTargetMs(ms) / 1000);
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
  };
}

export function restTargetPartsToMs(minutes: number, seconds: number): number {
  return clampRestTargetMs((minutes * 60 + seconds) * 1000);
}

const REST_TARGET_STEP_MS = 15_000;

/** Ajuste la durée cible par pas de 15 s (bornes 30 s – 5 min). */
export function adjustRestTargetMs(
  currentMs: number,
  deltaMs: number,
): number {
  const stepped =
    Math.round(currentMs / REST_TARGET_STEP_MS) * REST_TARGET_STEP_MS + deltaMs;
  return clampRestTargetMs(stepped);
}

export const REST_TARGET_PRESETS_MS = [
  60_000,
  90_000,
  120_000,
  150_000,
  180_000,
] as const;
