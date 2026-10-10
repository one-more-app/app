import { HomeWeekStrip } from "@/components/home/HomeWeekStrip";
import { StreakFlameCount } from "@/components/StreakFlameCount";
import { Card, CardContent } from "@/components/ui/card";
import { XpProgressBlock } from "@/components/XpProgressBlock";
import type { WeekDayCell } from "@/lib/activity-calendar";
import {
    formatMidnightCountdown,
    formatWeekdayLong,
    msUntilMidnight,
    type HomeStreakState,
} from "@/lib/home-day";
import { UI } from "@/lib/translations";
import type { UserProgressState } from "@/types";
import { Clock, Flame } from "lucide-react";
import { useEffect, useState } from "react";

type HomeProgressWeekCardProps = {
    progress: UserProgressState;
    streak: HomeStreakState;
    bonusPercent: number;
    weekCells: WeekDayCell[];
    selectedDay: string;
    onSelectDay: (dateKey: string) => void;
    onPrevWeek: () => void;
    onNextWeek: () => void;
    canGoPrev: boolean;
    canGoNext: boolean;
};

function useMidnightCountdown(enabled: boolean): number {
    const [remaining, setRemaining] = useState(() => msUntilMidnight());

    useEffect(() => {
        if (!enabled) return;
        const tick = () => setRemaining(msUntilMidnight());
        tick();
        const id = window.setInterval(tick, 30_000);
        return () => window.clearInterval(id);
    }, [enabled]);

    return remaining;
}

function StreakSummary({
    streak,
    bonusPercent,
}: {
    streak: HomeStreakState;
    bonusPercent: number;
}) {
    if (streak.kind === "none") {
        return (
            <div
                className="flex items-center gap-1 text-muted-foreground"
                role="img"
                aria-label={UI.homeStreakLostAria}
            >
                <Flame className="size-4 shrink-0" aria-hidden />
                <span className="font-one-more text-sm font-semibold italic tabular-nums">
                    0
                </span>
            </div>
        );
    }

    return (
        <StreakFlameCount
            count={streak.current}
            bonusPercent={bonusPercent}
            size="sm"
            iconClassName="size-4"
            textClassName="text-sm font-semibold tabular-nums"
            bonusClassName={streak.kind === "risk" ? "border-dashed" : undefined}
        />
    );
}

function StreakNote({ streak }: { streak: HomeStreakState }) {
    const remaining = useMidnightCountdown(streak.kind === "risk");

    if (streak.kind === "active") {
        return (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-4 shrink-0" aria-hidden />
                {UI.homeStreakKeptUntil.replace(
                    "{day}",
                    formatWeekdayLong(streak.deadlineDateKey),
                )}
            </p>
        );
    }

    if (streak.kind === "risk") {
        const countdown = formatMidnightCountdown(remaining);
        return (
            <div
                role="status"
                className="mt-3 flex items-center gap-2 rounded-xl bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-500"
            >
                <Clock className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">{UI.homeStreakRiskTitle}</span>
                <span
                    className="font-one-more text-sm italic tabular-nums"
                    aria-label={UI.homeStreakRiskCountdownAria.replace(
                        "{time}",
                        countdown,
                    )}
                >
                    {countdown}
                </span>
            </div>
        );
    }

    return null;
}

export function HomeProgressWeekCard({
    progress,
    streak,
    bonusPercent,
    weekCells,
    selectedDay,
    onSelectDay,
    onPrevWeek,
    onNextWeek,
    canGoPrev,
    canGoNext,
}: HomeProgressWeekCardProps) {
    return (
        <Card data-tour="home-progress-banner" className="mb-4 py-3">
            <CardContent className="pt-0">
                <XpProgressBlock
                    level={progress.level}
                    xpIntoLevel={progress.xpIntoLevel}
                    xpForNextLevel={progress.xpForNextLevel}
                    rightSlot={<StreakSummary streak={streak} bonusPercent={bonusPercent} />}
                />
                <div className="mt-3 border-t border-border pt-3">
                    <HomeWeekStrip
                        cells={weekCells}
                        selectedDay={selectedDay}
                        onSelectDay={onSelectDay}
                        onPrevWeek={onPrevWeek}
                        onNextWeek={onNextWeek}
                        canGoPrev={canGoPrev}
                        canGoNext={canGoNext}
                        todayAtRisk={streak.kind === "risk"}
                        streakLost={
                            streak.kind === "none" && weekCells.some((cell) => cell.isToday)
                        }
                    />
                    <StreakNote streak={streak} />
                </div>
            </CardContent>
        </Card>
    );
}
