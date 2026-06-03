import { Badge } from "@/components/ui/badge";
import {
  usePerformanceEntriesData,
  useUserProgressData,
} from "@/hooks/use-api-data";
import { getCurrentMonthKey } from "@/lib/activity-calendar";
import { LEAGUE_COLORS } from "@/lib/league-colors";
import type { GlobalLeagueSummary } from "@/lib/muscle-league-stats";
import {
  countActiveDaysInMonth,
  countPersonalRecordsInMonth,
} from "@/lib/profile-month-stats";
import {
  profileNestedClass,
  profileSectionClass,
} from "@/lib/profile-section";
import { rankIdLabel, rankIdTier } from "@/lib/rank-display";
import { UI } from "@/lib/translations";
import type { PerformanceEntry, UserProgressState } from "@/types";
import { Flame, Medal, Trophy } from "lucide-react";
import { useMemo } from "react";

export function ProfileHighlightsCard({
  leagueSummary,
  progress: progressProp,
  performanceEntries: performanceEntriesProp,
}: {
  leagueSummary: GlobalLeagueSummary | null;
  progress?: UserProgressState;
  performanceEntries?: PerformanceEntry[];
}) {
  const { data: progressFromHook } = useUserProgressData();
  const { data: performanceEntriesFromHook } = usePerformanceEntriesData();
  const progress = progressProp ?? progressFromHook;
  const performanceEntries =
    performanceEntriesProp ?? performanceEntriesFromHook ?? [];
  const monthKey = getCurrentMonthKey();

  const pct =
    progress && progress.xpForNextLevel > 0
      ? Math.min(
          100,
          Math.round((progress.xpIntoLevel / progress.xpForNextLevel) * 100),
        )
      : 0;

  const { recordsThisMonth, activeDaysThisMonth } = useMemo(() => {
    return {
      recordsThisMonth: countPersonalRecordsInMonth(
        performanceEntries,
        monthKey,
      ),
      activeDaysThisMonth: countActiveDaysInMonth(performanceEntries, monthKey),
    };
  }, [performanceEntries, monthKey]);

  return (
    <section className={profileSectionClass}>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-2">
          <span className="text-sm font-semibold">
            {progress
              ? UI.xpLevelLabel.replace("{level}", String(progress.level))
              : "—"}
          </span>
          {progress ? (
            <>
              <div
                className="h-2 overflow-hidden rounded-full bg-background"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {UI.xpTotalLabel.replace("{xp}", String(progress.totalXp))}
              </p>
            </>
          ) : null}
        </div>

        <div className={`${profileNestedClass} p-3`}>
          <p className="text-xs text-muted-foreground">
            {UI.profileGlobalLeague}
          </p>
          {leagueSummary ? (
            <Badge
              className={`mt-1.5 px-2 py-0.5 text-xs font-semibold ${LEAGUE_COLORS[rankIdTier(leagueSummary.globalRank)]}`}
            >
              {rankIdLabel(leagueSummary.globalRank)}
            </Badge>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">—</p>
          )}
        </div>

        <div className={`${profileNestedClass} p-3`}>
          <p className="text-xs text-muted-foreground">
            {UI.profileRankedExercises}
          </p>
          <p className="mt-1 flex items-center gap-1 text-lg font-bold tabular-nums">
            <Trophy className="size-4 text-muted-foreground" aria-hidden />
            {leagueSummary?.exerciseCount ?? 0}
          </p>
        </div>

        <div className={`${profileNestedClass} p-3`}>
          <p className="text-xs text-muted-foreground">
            {UI.profileRecordsThisMonth}
          </p>
          <p className="mt-1 flex items-center gap-1 text-lg font-bold tabular-nums">
            <Medal className="size-4 text-amber-500" aria-hidden />
            {recordsThisMonth}
          </p>
        </div>

        <div className={`${profileNestedClass} p-3`}>
          <p className="text-xs text-muted-foreground">
            {UI.profileActiveDaysThisMonth}
          </p>
          <p className="mt-1 flex items-center gap-1 text-lg font-bold tabular-nums">
            <Flame className="size-4 text-red-500" aria-hidden />
            {activeDaysThisMonth}
          </p>
        </div>
      </div>
    </section>
  );
}
