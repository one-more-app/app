import { localDateKey, localHour, localMinute, normalizeLocalHour } from './timezone.js';

/** Fixed local hour slots for D+1 training reminders. */
export const NEW_USER_D1_TRAINING_HOURS = [7, 11, 16] as const;

export type NewUserD1TrainingHour = (typeof NEW_USER_D1_TRAINING_HOURS)[number];

const MIDDAY_WINDOW_START_MINUTE = 12 * 60;
const MIDDAY_WINDOW_MINUTES = 120;

/**
 * Shift a YYYY-MM-DD local date key by a number of calendar days.
 */
export function shiftLocalDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

/**
 * Yesterday's local date key for a timezone (relative to `date`).
 */
export function previousLocalDateKey(timezone: string, date = new Date()): string {
  return shiftLocalDateKey(localDateKey(timezone, date), -1);
}

/**
 * Deterministic minute-of-day in [12:00, 14:00) for the referral slot.
 * Stable across cron ticks and API instances for the same user + local day.
 */
export function middayReferralMinuteOfDay(userId: string, localDate: string): number {
  let hash = 0;
  const seed = `${userId}:${localDate}`;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return MIDDAY_WINDOW_START_MINUTE + (hash % MIDDAY_WINDOW_MINUTES);
}

export function isNewUserD1TrainingSlot(
  timezone: string,
  date = new Date(),
): NewUserD1TrainingHour | null {
  const hour = normalizeLocalHour(localHour(timezone, date));
  const minute = localMinute(timezone, date);
  if (minute !== 0) return null;
  if ((NEW_USER_D1_TRAINING_HOURS as readonly number[]).includes(hour)) {
    return hour as NewUserD1TrainingHour;
  }
  return null;
}

export function isNewUserD1ReferralDue(
  userId: string,
  timezone: string,
  date = new Date(),
): boolean {
  const today = localDateKey(timezone, date);
  const minuteOfDay =
    normalizeLocalHour(localHour(timezone, date)) * 60 + localMinute(timezone, date);
  return middayReferralMinuteOfDay(userId, today) === minuteOfDay;
}
