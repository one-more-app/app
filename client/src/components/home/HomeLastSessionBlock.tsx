import { HomeDayTitle } from "@/components/home/HomeDayTitle";
import { HomeRecapTeaser } from "@/components/home/HomeRecapTeaser";
import {
  pickPrimaryDaySession,
  useDaySessions,
} from "@/hooks/use-day-sessions";
import { getActivityDayKey } from "@/lib/activity-from-performances";
import { formatCompactDuration, formatHomeDayShort } from "@/lib/home-day";
import { getLocalDateKey } from "@/lib/local-date";
import { scopeDayEntriesToSession } from "@/lib/scope-session-entries";
import { UI } from "@/lib/translations";
import type { PerformanceEntry } from "@/types";
import { computeSessionTiming } from "@one-more/shared/session-timing";
import { ChevronRight } from "lucide-react";
import { useMemo } from "react";

type HomeLastSessionBlockProps = {
  ownerUserId: string;
  dayKey: string;
  entries: PerformanceEntry[];
  onSelectDay: (dayKey: string) => void;
};

export function HomeLastSessionBlock({
  ownerUserId,
  dayKey,
  entries,
  onSelectDay,
}: HomeLastSessionBlockProps) {
  const { data: dayList } = useDaySessions(ownerUserId, dayKey);
  const primary = useMemo(
    () => pickPrimaryDaySession(dayList?.items ?? []),
    [dayList?.items],
  );

  const { durationLabel, exerciseCount } = useMemo(() => {
    const dayEntries = entries.filter(
      (entry) => !entry.deletedAt && getActivityDayKey(entry) === dayKey,
    );
    const scoped = primary?.id
      ? scopeDayEntriesToSession(dayEntries, primary.id)
      : dayEntries;
    const timing = computeSessionTiming(scoped, {
      dayKey,
      todayKey: getLocalDateKey(),
      endedAt: primary?.endedAt,
    });
    return {
      durationLabel: timing ? formatCompactDuration(timing.durationMs) : null,
      exerciseCount: new Set(scoped.map((entry) => entry.trackedExerciseId))
        .size,
    };
  }, [entries, dayKey, primary]);

  const linkLabel = durationLabel
    ? UI.homeLastSessionLink
        .replace("{day}", formatHomeDayShort(dayKey))
        .replace("{duration}", durationLabel)
    : formatHomeDayShort(dayKey);

  return (
    <section className="mt-6" aria-label={UI.homeLastSession}>
      <HomeDayTitle
        right={
          <button
            type="button"
            onClick={() => onSelectDay(dayKey)}
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-foreground"
          >
            {linkLabel}
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        }
      >
        {UI.homeLastSession}
      </HomeDayTitle>
      <HomeRecapTeaser
        ownerUserId={ownerUserId}
        dayKey={dayKey}
        sessionId={primary?.id}
        entries={entries}
        exerciseCount={exerciseCount}
      />
    </section>
  );
}
