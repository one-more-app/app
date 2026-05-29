import { Badge } from "@/components/ui/badge";
import { useUserProgressData } from "@/hooks/use-api-data";
import { LEAGUE_COLORS } from "@/lib/league-colors";
import type { GlobalLeagueSummary } from "@/lib/muscle-league-stats";
import { leagueLevelToFrenchLabel } from "@/lib/strength-standards";
import {
  profileNestedClass,
  profileSectionClass,
} from "@/lib/profile-section";
import { UI } from "@/lib/translations";
import { Flame, Trophy } from "lucide-react";

export function ProfileHighlightsCard({
    leagueSummary,
}: {
    leagueSummary: GlobalLeagueSummary | null;
}) {
    const { data: progress } = useUserProgressData();

    const pct =
        progress && progress.xpForNextLevel > 0
            ? Math.min(
                100,
                Math.round((progress.xpIntoLevel / progress.xpForNextLevel) * 100),
            )
            : 0;

    return (
        <section className={profileSectionClass}>
            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                            {progress
                                ? UI.xpLevelLabel.replace("{level}", String(progress.level))
                                : "—"}
                        </span>
                        {progress && progress.streak.current > 0 ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-orange-500">
                                <Flame className="size-3.5" aria-hidden />
                                {UI.streakDays.replace(
                                    "{days}",
                                    String(progress.streak.current),
                                )}
                            </span>
                        ) : null}
                    </div>
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
                    <p className="text-xs text-muted-foreground">{UI.profileGlobalLeague}</p>
                    {leagueSummary ? (
                        <Badge
                            className={`mt-1.5 px-2 py-0.5 text-xs font-semibold ${LEAGUE_COLORS[leagueSummary.globalLevel]}`}
                        >
                            {leagueLevelToFrenchLabel(leagueSummary.globalLevel)}
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
            </div>
        </section>
    );
}
