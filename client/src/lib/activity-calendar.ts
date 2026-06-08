import { getLocalDateKey } from "@/lib/local-date";

export type MonthDayCell = {
  date: string | null;
  active: boolean;
  isToday: boolean;
  isFuture: boolean;
};

function dayOfWeekMon0(date: Date): number {
  const js = date.getDay();
  return js === 0 ? 6 : js - 1;
}

export function getCurrentMonthKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return getCurrentMonthKey(d);
}

export function compareMonthKeys(a: string, b: string): number {
  return a.localeCompare(b);
}

export function parseMonthKey(monthKey: string): { year: number; month: number } {
  const [y, m] = monthKey.split("-").map(Number);
  return { year: y, month: m };
}

export function buildMonthCalendarGrid(
  monthKey: string,
  activeDays: string[],
  todayKey = getLocalDateKey(),
): MonthDayCell[] {
  const active = new Set(activeDays);
  const { year, month } = parseMonthKey(monthKey);
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const padStart = dayOfWeekMon0(first);

  const cells: MonthDayCell[] = [];
  for (let i = 0; i < padStart; i++) {
    cells.push({
      date: null,
      active: false,
      isToday: false,
      isFuture: false,
    });
  }

  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${monthPrefix}-${String(day).padStart(2, "0")}`;
    cells.push({
      date,
      active: active.has(date),
      isToday: date === todayKey,
      isFuture: date > todayKey,
    });
  }

  return cells;
}

export function formatActivityDayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatMonthLabel(monthKey: string): string {
  const { year, month } = parseMonthKey(monthKey);
  const date = new Date(year, month - 1, 1);
  const label = date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;
const WEEKDAY_SHORT = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"] as const;

export function getWeekdayLabels(): readonly string[] {
  return WEEKDAY_LABELS;
}

export function getWeekdayShortLabels(): readonly string[] {
  return WEEKDAY_SHORT;
}

export type WeekDayCell = {
  date: string;
  active: boolean;
  isToday: boolean;
  isFuture: boolean;
};

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Lundi de la semaine calendaire contenant `dateKey`. */
export function getWeekStartDateKey(dateKey = getLocalDateKey()): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - dayOfWeekMon0(date));
  return getLocalDateKey(date);
}

export function shiftWeekStartDateKey(
  weekStartDateKey: string,
  deltaWeeks: number,
): string {
  const date = parseDateKey(weekStartDateKey);
  date.setDate(date.getDate() + deltaWeeks * 7);
  return getLocalDateKey(date);
}

/** Les 7 jours (lun. → dim.) d'une semaine à partir de son lundi. */
export function buildWeekCells(
  activeDays: string[],
  weekStartDateKey: string,
  todayKey = getLocalDateKey(),
): WeekDayCell[] {
  const active = new Set(activeDays);
  const start = parseDateKey(weekStartDateKey);
  const cells: WeekDayCell[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateKey = getLocalDateKey(date);
    cells.push({
      date: dateKey,
      active: active.has(dateKey),
      isToday: dateKey === todayKey,
      isFuture: dateKey > todayKey,
    });
  }

  return cells;
}

/** @deprecated Préférer `buildWeekCells` avec un lundi explicite. */
export function buildCurrentWeekCells(
  activeDays: string[],
  todayKey = getLocalDateKey(),
): WeekDayCell[] {
  return buildWeekCells(activeDays, getWeekStartDateKey(todayKey), todayKey);
}
