import { todayDateKey } from './streak-dates.js';

/** Inactivité max (ms) avant de considérer la séance du jour terminée. */
export const SESSION_ACTIVE_IDLE_MS = 25 * 60 * 1000;

export type SessionEntryLike = {
  createdAt: string;
};

export type SessionTiming = {
  isInProgress: boolean;
  durationMs: number;
  startedAt: string;
  endedAt: string | null;
};

export type SessionDurationLabels = {
  minutes: (count: number) => string;
  hours: (hours: number, minutes: number) => string;
  inProgress: string;
  inProgressWithDuration: (duration: string) => string;
};

const defaultDurationLabels: SessionDurationLabels = {
  minutes: (count) => `${count} min`,
  hours: (hours, minutes) =>
    minutes > 0
      ? `${hours} h ${String(minutes).padStart(2, '0')}`
      : `${hours} h`,
  inProgress: 'En cours',
  inProgressWithDuration: (duration) => `En cours · ${duration}`,
};

export function getSessionBounds(
  entries: SessionEntryLike[],
): { first: SessionEntryLike; last: SessionEntryLike } | null {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  return { first: sorted[0]!, last: sorted[sorted.length - 1]! };
}

export type ComputeSessionTimingOpts = {
  now?: number;
  dayKey?: string;
  todayKey?: string;
  isPresenceTraining?: boolean;
};

export function computeSessionTiming(
  entries: SessionEntryLike[],
  opts: ComputeSessionTimingOpts = {},
): SessionTiming | null {
  const bounds = getSessionBounds(entries);
  if (!bounds) return null;

  const now = opts.now ?? Date.now();
  const todayKey = opts.todayKey ?? todayDateKey(new Date(now));
  const dayKey = opts.dayKey;
  const startedAt = bounds.first.createdAt;
  const lastAt = bounds.last.createdAt;
  const firstMs = new Date(startedAt).getTime();
  const lastMs = new Date(lastAt).getTime();

  const isToday = dayKey != null && dayKey === todayKey;
  const idleMs = now - lastMs;
  const isInProgress =
    isToday &&
    (opts.isPresenceTraining === true ||
      idleMs < SESSION_ACTIVE_IDLE_MS);

  const durationMs = isInProgress ? now - firstMs : lastMs - firstMs;

  return {
    isInProgress,
    durationMs,
    startedAt,
    endedAt: isInProgress ? null : lastAt,
  };
}

/** Minutes d'affichage (minimum 1 min si durée < 60 s). */
export function sessionDurationDisplayMinutes(durationMs: number): number {
  if (durationMs < 60_000) return 1;
  return Math.round(durationMs / 60_000);
}

export function formatSessionDuration(
  durationMs: number,
  labels: Pick<SessionDurationLabels, 'minutes' | 'hours'> = defaultDurationLabels,
): string {
  const totalMinutes = sessionDurationDisplayMinutes(durationMs);
  if (totalMinutes < 60) {
    return labels.minutes(totalMinutes);
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return labels.hours(hours, minutes);
}

export function formatSessionTimingLabel(
  timing: SessionTiming,
  labels: SessionDurationLabels = defaultDurationLabels,
): string {
  const duration = formatSessionDuration(timing.durationMs, labels);
  if (timing.isInProgress) {
    return labels.inProgressWithDuration(duration);
  }
  return duration;
}
