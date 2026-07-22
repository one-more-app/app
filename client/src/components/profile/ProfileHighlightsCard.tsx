import { RankBadge } from "@/components/RankBadge";
import { StreakFlameCount } from "@/components/StreakFlameCount";
import { Card, CardContent } from "@/components/ui/card";
import {
    usePerformanceEntriesData,
    useUserProgressData,
} from "@/hooks/use-api-data";
import { getCurrentMonthKey } from "@/lib/activity-calendar";
import type { GlobalLeagueSummary } from "@/lib/muscle-league-stats";
import {
    countActiveDaysInMonth,
    countPersonalRecordsInMonth,
} from "@/lib/profile-month-stats";
import { profileNestedClass } from "@/lib/profile-section";
import { resolveProgressStreak } from "@/lib/streak-display";
import { resolveStreakXpBonus } from "@/lib/streak-xp-display";
import { UI } from "@/lib/translations";
import type { PerformanceEntry, UserProgressState } from "@/types";
import { CalendarDays, Medal, Trophy } from "lucide-react";
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

    const { current: currentStreak } = progress
        ? resolveProgressStreak(progress)
        : { current: 0 };
    const streakXpBonus = progress ? resolveStreakXpBonus(progress) : null;

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
        <Card>
            <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                            <span
                                className="inline-flex items-baseline gap-1 text-xs font-semibold font-one-more uppercase italic text-muted-foreground"
                                aria-label={
                                    progress
                                        ? UI.xpLevelLabel.replace(
                                            "{level}",
                                            String(progress.level),
                                        )
                                        : undefined
                                }
                            >
                                {progress ? (
                                    <>
                                        {UI.profileLevelLabel}
                                        <span className="text-base font-bold tabular-nums leading-none text-primary dark:text-primary-foreground italic">
                                            {progress.level}
                                        </span>
                                    </>
                                ) : (
                                    "–"
                                )}
                            </span>
                            {progress ? (
                                <StreakFlameCount
                                    count={currentStreak}
                                    bonusPercent={streakXpBonus?.bonusPercent}
                                    size="sm"
                                    iconClassName="size-4"
                                    textClassName="text-sm font-semibold tabular-nums"
                                />
                            ) : null}
                        </div>
                        {progress ? (
                            <>
                                <div
                                    className="h-2 overflow-hidden rounded-full bg-background dark:bg-muted"
                                    role="progressbar"
                                    aria-valuenow={pct}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                >
                                    <div
                                        className="h-full rounded-full bg-primary dark:bg-primary-foreground transition-all"
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
                            <RankBadge
                                rankId={leagueSummary.globalRank}
                                size="md"
                                className="mt-1.5"
                            />
                        ) : (
                            <p className="mt-1 text-sm text-muted-foreground">–</p>
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
                            <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
                            {activeDaysThisMonth}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
