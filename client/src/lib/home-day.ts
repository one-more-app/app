import { getActivityDayKey } from "@/lib/activity-from-performances";
import { getLocalDateKey } from "@/lib/local-date";
import type { PerformanceEntry } from "@/types";
import { sessionDurationDisplayMinutes } from "@one-more/shared/session-timing";
import {
  STREAK_ALLOWED_REST_DAYS,
  STREAK_MAX_GAP_DAYS,
  applyStreakExpiry,
  calendarDaysBetween,
  isStreakOnGraceDay,
} from "@one-more/shared/streak-dates";

export type HomeDayKind =
  | "live"
  | "session"
  | "today-empty"
  | "rest"
  | "none"
  | "future";

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return getLocalDateKey(date);
}

function capitalize(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** « vendredi » */
export function formatWeekdayLong(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString("fr-FR", { weekday: "long" });
}

/** « Lundi 5 octobre » */
export function formatHomeDayTitle(dateKey: string): string {
  return capitalize(
    parseDateKey(dateKey).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  );
}

/** « Mardi 6 » */
export function formatHomeDayShort(dateKey: string): string {
  return capitalize(
    parseDateKey(dateKey).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
    }),
  );
}

/** Durée compacte : `55'` sous l'heure, `1h12` au-delà. */
export function formatCompactDuration(durationMs: number): string {
  const total = sessionDurationDisplayMinutes(durationMs);
  if (total < 60) return `${total}'`;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${hours}h${String(minutes).padStart(2, "0")}`;
}

/** Dernier jour avec séance, au plus tard `onOrBefore` (inclus). */
export function findLastSessionDay(
  activeDays: string[],
  onOrBefore: string,
): string | null {
  let last: string | null = null;
  for (const day of activeDays) {
    if (day <= onOrBefore && (last === null || day > last)) last = day;
  }
  return last;
}

export function classifyHomeDay({
  dayKey,
  todayKey,
  activeDays,
  hasLiveSession,
}: {
  dayKey: string;
  todayKey: string;
  activeDays: string[];
  hasLiveSession: boolean;
}): HomeDayKind {
  const hasSession = activeDays.includes(dayKey);
  if (dayKey === todayKey) {
    if (hasSession) return hasLiveSession ? "live" : "session";
    return "today-empty";
  }
  if (dayKey > todayKey) return "future";
  if (hasSession) return "session";

  const previous = findLastSessionDay(activeDays, addDaysToDateKey(dayKey, -1));
  if (
    previous &&
    calendarDaysBetween(previous, dayKey) <= STREAK_ALLOWED_REST_DAYS
  ) {
    return "rest";
  }
  return "none";
}

export type HomeStreakState =
  | { kind: "none" }
  | { kind: "active"; current: number; deadlineDateKey: string }
  | { kind: "risk"; current: number; deadlineDateKey: string };

/**
 * État de la série pour la carte progression.
 * `none` : pas de série (jamais lancée ou perdue).
 * `risk` : dernier jour pour séance sinon la série tombe à minuit.
 */
export function resolveHomeStreak({
  streakCurrent,
  lastActiveDate,
  todayKey,
}: {
  streakCurrent: number;
  lastActiveDate: string | null | undefined;
  todayKey: string;
}): HomeStreakState {
  if (!lastActiveDate) return { kind: "none" };
  const current = applyStreakExpiry(lastActiveDate, streakCurrent, todayKey);
  if (current <= 0) return { kind: "none" };
  const deadlineDateKey = addDaysToDateKey(lastActiveDate, STREAK_MAX_GAP_DAYS);
  if (isStreakOnGraceDay(lastActiveDate, current, todayKey)) {
    return { kind: "risk", current, deadlineDateKey };
  }
  return { kind: "active", current, deadlineDateKey };
}

/** Dernier jour d'activité connu : serveur ou perfs locales (le plus récent). */
export function resolveLastActiveDate(
  serverLastActiveDate: string | null | undefined,
  activeDays: string[],
  todayKey: string,
): string | null {
  const local = findLastSessionDay(activeDays, todayKey);
  if (!serverLastActiveDate) return local;
  if (!local) return serverLastActiveDate;
  return local > serverLastActiveDate ? local : serverLastActiveDate;
}

export function msUntilMidnight(now = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

/** « 5 h 42 » (arrondi à la minute supérieure). */
export function formatMidnightCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} h ${String(minutes).padStart(2, "0")}`;
}

/** Volume d'une série (poids × reps, poids du corps compté pour 1). */
export function entryVolume(entry: PerformanceEntry): number {
  const load = entry.weight > 0 ? entry.weight : 1;
  return load * entry.reps;
}

export type VolumeSessionBar = {
  sessionKey: string;
  dayKey: string;
  volume: number;
  startedAt: string;
};

/** Clé de regroupement : séance first-class, sinon bucket jour legacy. */
export function volumeSessionKeyForEntry(entry: PerformanceEntry): string {
  return entry.workoutSessionId ?? `day:${getActivityDayKey(entry)}`;
}

export type BuildRecentVolumeSessionsOptions = {
  /** Fin de fenêtre inclusive (récap d'une séance précise). */
  throughSessionKey?: string;
  /** Garantit / surcharge la barre de la séance affichée. */
  anchor?: {
    sessionKey: string;
    dayKey: string;
    volume: number;
    startedAt?: string;
  };
};

type VolumeBucket = {
  sessionKey: string;
  dayKey: string;
  volume: number;
  startedAt: string;
};

/**
 * Volume (poids × reps) des dernières séances jusqu'à `dayKey` inclus,
 * une barre = une séance (`workoutSessionId`, sinon bucket jour).
 */
export function buildRecentVolumeSessions(
  entries: PerformanceEntry[],
  dayKey: string,
  maxBars = 6,
  options?: BuildRecentVolumeSessionsOptions,
): VolumeSessionBar[] {
  const buckets = new Map<string, VolumeBucket>();

  for (const entry of entries) {
    if (entry.deletedAt) continue;
    const day = getActivityDayKey(entry);
    if (day > dayKey) continue;
    const sessionKey = volumeSessionKeyForEntry(entry);
    const existing = buckets.get(sessionKey);
    const volume = entryVolume(entry);
    if (!existing) {
      buckets.set(sessionKey, {
        sessionKey,
        dayKey: day,
        volume,
        startedAt: entry.createdAt,
      });
      continue;
    }
    existing.volume += volume;
    if (entry.createdAt < existing.startedAt) {
      existing.startedAt = entry.createdAt;
    }
  }

  const anchor = options?.anchor;
  if (anchor) {
    const existing = buckets.get(anchor.sessionKey);
    buckets.set(anchor.sessionKey, {
      sessionKey: anchor.sessionKey,
      dayKey: anchor.dayKey,
      volume: anchor.volume,
      startedAt:
        anchor.startedAt ??
        existing?.startedAt ??
        `${anchor.dayKey}T12:00:00.000Z`,
    });
  }

  const sorted = [...buckets.values()].sort((a, b) => {
    const byStart = a.startedAt.localeCompare(b.startedAt);
    if (byStart !== 0) return byStart;
    return a.sessionKey.localeCompare(b.sessionKey);
  });

  const throughSessionKey =
    options?.throughSessionKey ?? anchor?.sessionKey ?? null;
  let windowed = sorted;
  if (throughSessionKey) {
    const endIndex = sorted.findIndex(
      (bar) => bar.sessionKey === throughSessionKey,
    );
    if (endIndex >= 0) {
      windowed = sorted.slice(0, endIndex + 1);
    }
  }

  return windowed.slice(-maxBars);
}

/**
 * Volumes seuls des dernières séances jusqu'à `dayKey` inclus.
 * Sert au mini graphique du teaser récap.
 */
export function buildRecentVolumeBars(
  entries: PerformanceEntry[],
  dayKey: string,
  maxBars = 6,
): number[] {
  return buildRecentVolumeSessions(entries, dayKey, maxBars).map(
    (bar) => bar.volume,
  );
}
