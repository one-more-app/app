import { Button } from "@/components/ui/button";
import { useUserActivityData } from "@/hooks/use-api-data";
import {
  buildMonthCalendarGrid,
  compareMonthKeys,
  formatActivityDayLabel,
  formatMonthLabel,
  getCurrentMonthKey,
  getWeekdayLabels,
  shiftMonthKey,
} from "@/lib/activity-calendar";
import { profileNestedClass, profileSectionClass } from "@/lib/profile-section";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Flame, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

function ActivityMonthSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1.5" aria-hidden>
      {Array.from({ length: 35 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}

export function ProfileActivitySection() {
  const [month, setMonth] = useState(() => getCurrentMonthKey());
  const { data, isLoading } = useUserActivityData(month);

  const bounds = data?.bounds ?? {
    earliestMonth: month,
    latestMonth: getCurrentMonthKey(),
  };

  const canGoPrev = compareMonthKeys(month, bounds.earliestMonth) > 0;
  const canGoNext = compareMonthKeys(month, bounds.latestMonth) < 0;

  const cells = useMemo(() => {
    if (!data) return [];
    return buildMonthCalendarGrid(data.month, data.activeDays);
  }, [data]);

  const currentStreak = data?.streak.current ?? 0;
  const longestStreak = data?.streak.longest ?? 0;
  const activeCount = data?.activeDayCount ?? 0;
  const weekdayLabels = getWeekdayLabels();

  return (
    <section className={profileSectionClass} aria-labelledby="profile-activity-title">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2
          id="profile-activity-title"
          className="text-sm font-medium text-foreground"
        >
          {UI.profileActivityTitle}
        </h2>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            disabled={!canGoPrev || isLoading}
            aria-label={UI.profileActivityPrevMonth}
            onClick={() => setMonth((m) => shiftMonthKey(m, -1))}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <p
            className="min-w-[8.5rem] text-center text-sm font-medium capitalize tabular-nums"
            aria-live="polite"
          >
            {formatMonthLabel(month)}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            disabled={!canGoNext || isLoading}
            aria-label={UI.profileActivityNextMonth}
            onClick={() => setMonth((m) => shiftMonthKey(m, 1))}
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className={cn(profileNestedClass, "flex items-center gap-3 p-3")}>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-500/15">
            <Flame className="size-5 text-orange-500" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {UI.profileActivityStreakCurrent}
            </p>
            <p className="truncate text-lg font-bold tabular-nums">
              {currentStreak > 0
                ? UI.streakDays.replace("{days}", String(currentStreak))
                : "—"}
            </p>
          </div>
        </div>
        <div className={cn(profileNestedClass, "flex items-center gap-3 p-3")}>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
            <Trophy className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {UI.profileActivityStreakLongest}
            </p>
            <p className="truncate text-lg font-bold tabular-nums">
              {longestStreak > 0
                ? UI.streakDays.replace("{days}", String(longestStreak))
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <ActivityMonthSkeleton />
      ) : (
        <>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
            {weekdayLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div
            className="grid grid-cols-7 gap-1.5"
            role="img"
            aria-label={`${UI.profileActivityTitle} — ${formatMonthLabel(month)}`}
          >
            {cells.map((cell, i) =>
              cell.date == null ? (
                <div key={`pad-${i}`} className="aspect-square" aria-hidden />
              ) : (
                <div
                  key={cell.date}
                  title={formatActivityDayLabel(cell.date)}
                  aria-label={
                    cell.isFuture
                      ? undefined
                      : `${formatActivityDayLabel(cell.date)} — ${
                          cell.active
                            ? UI.profileActivityMore
                            : UI.profileActivityLess
                        }`
                  }
                  className={cn(
                    "relative flex aspect-square items-center justify-center rounded-lg text-[10px] font-medium tabular-nums transition-colors",
                    cell.isFuture && "bg-transparent text-muted-foreground/40",
                    !cell.isFuture &&
                      !cell.active &&
                      "bg-muted/80 text-muted-foreground/50",
                    !cell.isFuture &&
                      cell.active &&
                      "bg-orange-500 text-white shadow-sm shadow-orange-500/25",
                    cell.isToday &&
                      !cell.isFuture &&
                      "ring-2 ring-orange-400 ring-offset-2 ring-offset-card",
                  )}
                >
                  {!cell.isFuture ? (
                    <span
                      className={cn(
                        "text-[11px] leading-none",
                        cell.active ? "text-white" : "text-muted-foreground",
                      )}
                    >
                      {Number(cell.date.slice(8, 10))}
                    </span>
                  ) : null}
                </div>
              ),
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {activeCount > 0
                ? UI.profileActivityDaysInMonth.replace(
                    "{count}",
                    String(activeCount),
                  )
                : UI.profileActivityEmpty}
            </span>
            <div className="flex items-center gap-2">
              <span>{UI.profileActivityLess}</span>
              <div className="size-3.5 rounded-md bg-muted/80" aria-hidden />
              <div
                className="size-3.5 rounded-md bg-orange-500 shadow-sm shadow-orange-500/20"
                aria-hidden
              />
              <span>{UI.profileActivityMore}</span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
