import { UI } from "@/lib/translations";

export const ISO_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export type IsoWeekday = (typeof ISO_WEEKDAYS)[number];

export type ReminderSlot = {
  weekday: IsoWeekday;
  hour: number;
  minute: number;
};

export const DEFAULT_REMINDER_WEEKDAYS: IsoWeekday[] = [1, 3, 5];
export const DEFAULT_REMINDER_HOUR = 18;
export const DEFAULT_REMINDER_MINUTE = 0;
export const REMINDER_HOUR_MIN = 0;
export const REMINDER_HOUR_MAX = 23;

export function normalizeReminderWeekdays(days: number[]): IsoWeekday[] {
  const unique = new Set<IsoWeekday>();
  for (const day of days) {
    if (day >= 1 && day <= 7) unique.add(day as IsoWeekday);
  }
  return [...unique].sort((a, b) => a - b);
}

export function clampReminderHour(hour: number): number {
  if (!Number.isFinite(hour)) return DEFAULT_REMINDER_HOUR;
  return Math.min(
    REMINDER_HOUR_MAX,
    Math.max(REMINDER_HOUR_MIN, Math.round(hour)),
  );
}

export function clampReminderMinute(minute: number): number {
  if (!Number.isFinite(minute)) return DEFAULT_REMINDER_MINUTE;
  return Math.min(59, Math.max(0, Math.round(minute)));
}

export function formatReminderTime(hour: number, minute = 0): string {
  return `${hour}h${String(minute).padStart(2, "0")}`;
}

export function normalizeReminderSlots(
  slots: Array<{ weekday?: number; hour?: number; minute?: number } | null | undefined>,
): ReminderSlot[] {
  const byDay = new Map<IsoWeekday, ReminderSlot>();
  for (const slot of slots) {
    if (!slot) continue;
    const weekday = Number(slot.weekday);
    if (weekday < 1 || weekday > 7) continue;
    byDay.set(weekday as IsoWeekday, {
      weekday: weekday as IsoWeekday,
      hour: clampReminderHour(Number(slot.hour)),
      minute: clampReminderMinute(Number(slot.minute)),
    });
  }
  return [...byDay.values()].sort((a, b) => a.weekday - b.weekday);
}

export function slotsFromLegacy(
  days: number[],
  hour = DEFAULT_REMINDER_HOUR,
  minute = DEFAULT_REMINDER_MINUTE,
): ReminderSlot[] {
  return normalizeReminderWeekdays(days).map((weekday) => ({
    weekday,
    hour: clampReminderHour(hour),
    minute: clampReminderMinute(minute),
  }));
}

export const DEFAULT_REMINDER_SLOTS: ReminderSlot[] = slotsFromLegacy(
  DEFAULT_REMINDER_WEEKDAYS,
  DEFAULT_REMINDER_HOUR,
  DEFAULT_REMINDER_MINUTE,
);

export function reminderSlotsFromPrefs(prefs: {
  reminderSlots?: Array<{ weekday?: number; hour?: number; minute?: number }> | null;
  reminderWeekdays?: number[];
  reminderHour?: number;
  reminderMinute?: number;
}): ReminderSlot[] {
  if (Array.isArray(prefs.reminderSlots)) {
    return normalizeReminderSlots(prefs.reminderSlots);
  }
  return slotsFromLegacy(
    prefs.reminderWeekdays ?? [],
    prefs.reminderHour ?? DEFAULT_REMINDER_HOUR,
    prefs.reminderMinute ?? DEFAULT_REMINDER_MINUTE,
  );
}

export function toggleReminderSlot(
  slots: ReminderSlot[],
  weekday: IsoWeekday,
  inheritFrom?: ReminderSlot | null,
): ReminderSlot[] {
  const current = normalizeReminderSlots(slots);
  if (current.some((slot) => slot.weekday === weekday)) {
    return current.filter((slot) => slot.weekday !== weekday);
  }
  const source = inheritFrom ?? current.at(-1);
  return normalizeReminderSlots([
    ...current,
    {
      weekday,
      hour: source?.hour ?? DEFAULT_REMINDER_HOUR,
      minute: source?.minute ?? DEFAULT_REMINDER_MINUTE,
    },
  ]);
}

export function setReminderSlotTime(
  slots: ReminderSlot[],
  weekday: IsoWeekday,
  hour: number,
  minute: number,
): ReminderSlot[] {
  return normalizeReminderSlots(
    slots.map((slot) =>
      slot.weekday === weekday ? { ...slot, hour, minute } : slot,
    ),
  );
}

export function reminderSlotsShareTime(slots: ReminderSlot[]): boolean {
  const normalized = normalizeReminderSlots(slots);
  if (normalized.length <= 1) return true;
  const first = normalized[0]!;
  return normalized.every(
    (slot) => slot.hour === first.hour && slot.minute === first.minute,
  );
}

export const REMINDER_WEEKDAY_OPTIONS: Array<{
  iso: IsoWeekday;
  short: string;
  full: string;
}> = [
  { iso: 1, short: UI.weekdayMon, full: UI.weekdayMonday },
  { iso: 2, short: UI.weekdayTue, full: UI.weekdayTuesday },
  { iso: 3, short: UI.weekdayWed, full: UI.weekdayWednesday },
  { iso: 4, short: UI.weekdayThu, full: UI.weekdayThursday },
  { iso: 5, short: UI.weekdayFri, full: UI.weekdayFriday },
  { iso: 6, short: UI.weekdaySat, full: UI.weekdaySaturday },
  { iso: 7, short: UI.weekdaySun, full: UI.weekdaySunday },
];

const WEEKDAY_NAMES: Record<IsoWeekday, string> = {
  1: UI.weekdayMonday,
  2: UI.weekdayTuesday,
  3: UI.weekdayWednesday,
  4: UI.weekdayThursday,
  5: UI.weekdayFriday,
  6: UI.weekdaySaturday,
  7: UI.weekdaySunday,
};

const WEEKDAY_SHORT: Record<IsoWeekday, string> = {
  1: UI.weekdayMon,
  2: UI.weekdayTue,
  3: UI.weekdayWed,
  4: UI.weekdayThu,
  5: UI.weekdayFri,
  6: UI.weekdaySat,
  7: UI.weekdaySun,
};

function joinDayNames(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) {
    return `${names[0]}${UI.reminderScheduleAnd}${names[1]}`;
  }
  return `${names.slice(0, -1).join(", ")}${UI.reminderScheduleAnd}${names[names.length - 1]}`;
}

export function formatReminderSchedule(slots: ReminderSlot[]): string {
  const sorted = normalizeReminderSlots(slots);
  if (sorted.length === 0) return "";
  if (!reminderSlotsShareTime(sorted)) {
    return sorted
      .map(
        (slot) =>
          `${WEEKDAY_SHORT[slot.weekday]} ${formatReminderTime(slot.hour, slot.minute)}`,
      )
      .join(" · ");
  }
  const time = formatReminderTime(sorted[0]!.hour, sorted[0]!.minute);
  const days = sorted.map((slot) => slot.weekday);
  if (days.length === 7) {
    return UI.reminderScheduleEveryDay.replace("{time}", time);
  }
  if (days.join(",") === "1,2,3,4,5") {
    return UI.reminderScheduleWeekdays.replace("{time}", time);
  }
  if (days.length === 1) {
    return UI.reminderScheduleOneDay
      .replace("{day}", WEEKDAY_NAMES[days[0]!])
      .replace("{time}", time);
  }
  return UI.reminderScheduleManyDays
    .replace("{days}", joinDayNames(days.map((day) => WEEKDAY_NAMES[day])))
    .replace("{time}", time);
}

export function weekdayFullName(weekday: IsoWeekday): string {
  return WEEKDAY_NAMES[weekday];
}
