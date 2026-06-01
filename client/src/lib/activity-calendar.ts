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

export function getWeekdayLabels(): readonly string[] {
  return WEEKDAY_LABELS;
}
