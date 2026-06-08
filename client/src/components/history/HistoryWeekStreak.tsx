import { Button } from "@/components/ui/button";
import {
  buildWeekCells,
  getWeekStartDateKey,
  getWeekdayLabels,
  getWeekdayShortLabels,
  shiftWeekStartDateKey,
} from "@/lib/activity-calendar";
import { collectActiveDayKeysFromEntries } from "@/lib/activity-from-performances";
import { getLocalDateKey } from "@/lib/local-date";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { PerformanceEntry } from "@/types";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

type HistoryWeekStreakProps = {
  entries: PerformanceEntry[];
};

function formatDayNumber(dateKey: string): string {
  return String(Number(dateKey.slice(8, 10)));
}

export function HistoryWeekStreak({ entries }: HistoryWeekStreakProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const todayKey = getLocalDateKey();
  const currentWeekStart = getWeekStartDateKey(todayKey);

  const weekStartDateKey = useMemo(
    () => shiftWeekStartDateKey(currentWeekStart, weekOffset),
    [currentWeekStart, weekOffset],
  );

  const weekCells = useMemo(() => {
    const activeDays = collectActiveDayKeysFromEntries(entries);
    return buildWeekCells(activeDays, weekStartDateKey, todayKey);
  }, [entries, weekStartDateKey, todayKey]);

  const weekdayLabels = getWeekdayLabels();
  const weekdayShortLabels = getWeekdayShortLabels();
  const canGoNext = weekOffset < 0;

  return (
    <section
      className="rounded-xl bg-card px-2 py-3"
      aria-label={UI.historyWeekNavLabel}
    >
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          className="shrink-0 text-muted-foreground"
          onClick={() => setWeekOffset((offset) => offset - 1)}
          aria-label={UI.historyWeekPrev}
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div className="grid min-w-0 flex-1 grid-cols-7 gap-0.5">
          {weekCells.map((cell, index) => {
            const weekday = weekdayLabels[index];
            const dayNumber = formatDayNumber(cell.date);
            const ariaLabel = cell.active
              ? UI.historyWeekTrainedDay.replace("{day}", weekday)
              : cell.isFuture
                ? UI.historyWeekFutureDay.replace("{day}", weekday)
                : UI.historyWeekRestDay.replace("{day}", weekday);

            return (
              <div
                key={cell.date}
                className="flex flex-col items-center gap-1"
              >
                <span
                  className={cn(
                    "text-[0.6rem] font-medium uppercase tracking-wide",
                    cell.isToday
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {weekdayShortLabels[index]}
                </span>
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border transition-colors",
                    cell.active &&
                      "border-accent bg-accent text-accent-foreground",
                    !cell.active &&
                      !cell.isFuture &&
                      "border-border bg-secondary text-muted-foreground",
                    cell.isFuture &&
                      !cell.active &&
                      "border-dashed border-border/60 bg-transparent text-muted-foreground/50",
                    cell.isToday &&
                      !cell.active &&
                      "border-foreground/40 ring-1 ring-foreground/20",
                    cell.isToday &&
                      cell.active &&
                      "ring-1 ring-accent/50",
                  )}
                  aria-label={ariaLabel}
                  title={ariaLabel}
                >
                  {cell.active ? (
                    <Check className="size-3 stroke-[2.5]" aria-hidden />
                  ) : (
                    <span className="text-[0.65rem] font-semibold tabular-nums">
                      {dayNumber}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="icon-xs"
          className="shrink-0 text-muted-foreground"
          disabled={!canGoNext}
          onClick={() => setWeekOffset((offset) => Math.min(0, offset + 1))}
          aria-label={UI.historyWeekNext}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </section>
  );
}
