import { Button } from "@/components/ui/button";
import { getWeekdayLabels, type WeekDayCell } from "@/lib/activity-calendar";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";

type HomeWeekStripProps = {
  cells: WeekDayCell[];
  selectedDay: string;
  onSelectDay: (dateKey: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  /** Dernier jour pour sauver la série : aujourd'hui passe en pointillés orange. */
  todayAtRisk?: boolean;
};

function dayNumber(dateKey: string): string {
  return String(Number(dateKey.slice(8, 10)));
}

function DayBubble({
  cell,
  atRisk,
}: {
  cell: WeekDayCell;
  atRisk: boolean;
}) {
  const base =
    "flex size-9 items-center justify-center rounded-full text-xs font-semibold tabular-nums";

  if (cell.isToday) {
    return (
      <span
        className={cn(
          base,
          "border-2",
          atRisk
            ? "border-dashed border-orange-500 text-orange-500"
            : "border-foreground/70 text-foreground",
          cell.active && "bg-orange-500/10",
        )}
      >
        {cell.active || atRisk ? (
          <Flame
            className={cn(
              "size-4 text-orange-500",
              cell.active && "fill-orange-500",
            )}
            aria-hidden
          />
        ) : (
          <span className="font-one-more italic">{dayNumber(cell.date)}</span>
        )}
      </span>
    );
  }

  if (cell.active) {
    return (
      <span className={cn(base, "bg-orange-500/15")}>
        <Flame className="size-4 fill-orange-500 text-orange-500" aria-hidden />
      </span>
    );
  }

  if (cell.isFuture) {
    return (
      <span
        className={cn(
          base,
          "border border-dashed border-border text-muted-foreground/70",
        )}
      >
        <span className="font-one-more italic">{dayNumber(cell.date)}</span>
      </span>
    );
  }

  return (
    <span className={cn(base, "bg-secondary text-secondary-foreground")}>
      <span className="font-one-more italic">{dayNumber(cell.date)}</span>
    </span>
  );
}

export function HomeWeekStrip({
  cells,
  selectedDay,
  onSelectDay,
  onPrevWeek,
  onNextWeek,
  canGoPrev,
  canGoNext,
  todayAtRisk = false,
}: HomeWeekStripProps) {
  const weekdayLabels = getWeekdayLabels();

  return (
    <div className="flex items-center gap-1" data-tour="home-week">
      <Button
        variant="ghost"
        size="icon-xs"
        className="shrink-0 text-muted-foreground"
        onClick={onPrevWeek}
        disabled={!canGoPrev}
        aria-label={UI.historyWeekPrev}
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div
        role="tablist"
        aria-label={UI.homeWeekNavLabel}
        className="grid min-w-0 flex-1 grid-cols-7 gap-0.5"
      >
        {cells.map((cell, index) => {
          const weekday = weekdayLabels[index];
          const selected = cell.date === selectedDay;
          return (
            <button
              key={cell.date}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={UI.homeWeekDaySelect
                .replace("{day}", weekday)
                .replace("{date}", dayNumber(cell.date))}
              onClick={() => onSelectDay(cell.date)}
              className="flex flex-col items-center gap-1 rounded-lg pb-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={cn(
                  "text-[0.65rem] font-medium uppercase tracking-wide",
                  selected || cell.isToday
                    ? "font-bold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {cell.isToday ? UI.homeWeekToday : weekday}
              </span>
              <DayBubble cell={cell} atRisk={todayAtRisk && cell.isToday} />
              <span
                aria-hidden
                className={cn(
                  "h-[3px] w-4 rounded-full",
                  selected ? "bg-foreground" : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="icon-xs"
        className="shrink-0 text-muted-foreground"
        onClick={onNextWeek}
        disabled={!canGoNext}
        aria-label={UI.historyWeekNext}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
