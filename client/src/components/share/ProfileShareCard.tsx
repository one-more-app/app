import { RankBadge } from "@/components/RankBadge";
import { StreakFlameCount } from "@/components/StreakFlameCount";
import { shareCardThemeVars } from "@/lib/celebration-visual";
import { resolvePublicAssetUrl } from "@/lib/exercise-share-media";
import type { GlobalLeagueSummary } from "@/lib/muscle-league-stats";
import type {
    MostTrainedExercise,
    TopExerciseByLeague,
} from "@/lib/profile-highlights";
import { resolveStreak } from "@/lib/streak-display";
import { resolveStreakXpBonus } from "@/lib/streak-xp-display";
import { UI } from "@/lib/translations";
import type { UserProgressState } from "@/types";
import { Sparkles } from "lucide-react";
import type { CSSProperties } from "react";

export type ProfileSharePayload = {
    displayName: string;
    progress: UserProgressState;
    leagueSummary: GlobalLeagueSummary | null;
    topByLeague: TopExerciseByLeague | null;
    mostTrained: MostTrainedExercise | null;
};

export const PROFILE_SHARE_WIDTH = 1080;

const txl = "text-[3.125rem]";
const tbase = "text-[2.5rem]";
const tsm = "text-[2.188rem]";
const txs = "text-[1.875rem]";
const gapMain = "gap-[2.5rem]";
const sharePadX = "px-[3.75rem]";
const sharePadY = "py-[3.75rem]";
const logoLockupH = "h-[6.25rem]";

export function ProfileShareCard({
    payload,
    isDark,
}: {
    payload: ProfileSharePayload;
    isDark: boolean;
}) {
    const logoSrc = resolvePublicAssetUrl("logo-white-text.png");
    const { displayName, progress, leagueSummary, topByLeague, mostTrained } =
        payload;
    const { current: currentStreak } = resolveStreak(
        progress.streak,
        progress.lastActiveDate,
    );
    const streakXpBonus = resolveStreakXpBonus(progress);

    return (
        <div
            data-share-card-root
            className="inline-block antialiased"
            style={{
                ...shareCardThemeVars(isDark),
                width: PROFILE_SHARE_WIDTH,
                minWidth: PROFILE_SHARE_WIDTH,
            }}
        >
            <div
                className="flex flex-col overflow-hidden rounded-xl border-2 border-border bg-card text-card-foreground"
                style={{ width: PROFILE_SHARE_WIDTH } as CSSProperties}
            >
                <div
                    className={`flex flex-col ${sharePadX} ${sharePadY} ${gapMain} text-center`}
                >
                    <div className="space-y-2">
                        <p className={`${txs} uppercase tracking-wide text-muted-foreground`}>
                            One More
                        </p>
                        <h2 className={`${txl} font-bold tracking-tight text-card-foreground`}>
                            {displayName}
                        </h2>
                    </div>

                    <div className={`flex flex-wrap items-center justify-center gap-4 ${tbase}`}>
                        <span className="inline-flex items-center gap-2 font-semibold">
                            <Sparkles className="size-10 text-primary" aria-hidden />
                            {UI.xpLevelLabel.replace("{level}", String(progress.level))}
                        </span>
                        <StreakFlameCount
                            count={currentStreak}
                            bonusPercent={streakXpBonus.bonusPercent}
                            iconClassName="size-10"
                            textClassName={`${tbase} font-semibold tabular-nums`}
                        />
                    </div>

                    {leagueSummary ? (
                        <div className="flex flex-col items-center gap-3">
                            <RankBadge
                                rankId={leagueSummary.globalRank}
                                variant={isDark ? "dark" : "light"}
                            />
                            <p className={`${txs} text-muted-foreground`}>
                                {UI.profileShareRanked.replace(
                                    "{count}",
                                    String(leagueSummary.exerciseCount),
                                )}
                            </p>
                        </div>
                    ) : null}

                    <div className={`grid w-full grid-cols-2 gap-6 text-left ${tsm}`}>
                        {topByLeague ? (
                            <div className="rounded-xl border border-border bg-muted/30 p-5">
                                <p className={`${txs} text-muted-foreground`}>
                                    {UI.profileTopByLeague}
                                </p>
                                <p className="mt-2 font-semibold capitalize">
                                    {topByLeague.exercise.name}
                                </p>
                                <RankBadge
                                    league={topByLeague.league}
                                    size="md"
                                    variant={isDark ? "dark" : "light"}
                                    className="mt-2"
                                />
                            </div>
                        ) : null}
                        {mostTrained ? (
                            <div className="rounded-xl border border-border bg-muted/30 p-5">
                                <p className={`${txs} text-muted-foreground`}>
                                    {UI.profileMostTrained}
                                </p>
                                <p className="mt-2 font-semibold capitalize">
                                    {mostTrained.exercise.name}
                                </p>
                                <p className="mt-2 text-muted-foreground">
                                    {UI.profilePerfCount.replace(
                                        "{count}",
                                        String(mostTrained.perfCount),
                                    )}
                                </p>
                            </div>
                        ) : null}
                    </div>

                    <img
                        src={logoSrc}
                        alt="One More"
                        width={360}
                        height={100}
                        crossOrigin="anonymous"
                        className={`${logoLockupH} mx-auto w-auto object-contain`}
                    />
                </div>
            </div>
        </div>
    );
}
