export type ReminderSlot = {
  weekday: number;
  hour: number;
  minute: number;
};

const DEFAULT_HOUR = 18;
const DEFAULT_MINUTE = 0;

function clampHour(hour: number): number {
  if (!Number.isFinite(hour)) return DEFAULT_HOUR;
  return Math.min(23, Math.max(0, Math.round(hour)));
}

function clampMinute(minute: number): number {
  if (!Number.isFinite(minute)) return DEFAULT_MINUTE;
  return Math.min(59, Math.max(0, Math.round(minute)));
}

export function normalizeReminderSlots(
  slots: Array<{ weekday?: number; hour?: number; minute?: number } | null | undefined>,
): ReminderSlot[] {
  const byDay = new Map<number, ReminderSlot>();
  for (const slot of slots) {
    if (!slot) continue;
    const weekday = Number(slot.weekday);
    if (weekday < 1 || weekday > 7) continue;
    byDay.set(weekday, {
      weekday,
      hour: clampHour(Number(slot.hour)),
      minute: clampMinute(Number(slot.minute)),
    });
  }
  return [...byDay.values()].sort((a, b) => a.weekday - b.weekday);
}

export function slotsFromLegacy(
  days: number[] | null | undefined,
  hour: number | null | undefined,
  minute: number | null | undefined,
): ReminderSlot[] {
  const unique = [
    ...new Set((days ?? []).filter((day) => day >= 1 && day <= 7)),
  ].sort((a, b) => a - b);
  return unique.map((weekday) => ({
    weekday,
    hour: clampHour(hour ?? DEFAULT_HOUR),
    minute: clampMinute(minute ?? DEFAULT_MINUTE),
  }));
}

export function resolveReminderSlots(input: {
  reminderSlots?: Array<{ weekday?: number; hour?: number; minute?: number }> | null;
  reminderWeekdays?: number[] | null;
  reminderHour?: number | null;
  reminderMinute?: number | null;
}): ReminderSlot[] {
  if (Array.isArray(input.reminderSlots)) {
    return normalizeReminderSlots(input.reminderSlots);
  }
  return slotsFromLegacy(
    input.reminderWeekdays,
    input.reminderHour,
    input.reminderMinute,
  );
}
