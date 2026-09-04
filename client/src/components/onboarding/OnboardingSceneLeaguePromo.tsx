import {
    CelebrationHeroMetric,
    leagueIconDropShadow,
} from "@/components/celebration-modal-ui";
import { RankBadge } from "@/components/RankBadge";
import { useTheme } from "@/hooks/use-theme";
import { leagueCelebrationRadialBackground } from "@/lib/celebration-visual";
import { leagueMapFill } from "@/lib/league-colors";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { ArrowRight, Trophy } from "lucide-react";

type OnboardingSceneLeaguePromoProps = {
    active: boolean;
    reduceMotion: boolean;
};

export function OnboardingSceneLeaguePromo({
    active,
    reduceMotion,
}: OnboardingSceneLeaguePromoProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    const glow = leagueMapFill("diamond", isDark);
    const animate = active && !reduceMotion;
    const perfLabel = UI.leaguePromotionCelebrationPerf
        .replace("{weight}", "100")
        .replace("{reps}", "5");

    return (
        <div className="relative flex h-full min-h-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: leagueCelebrationRadialBackground(glow) }}
            />
            <div
                className={cn(
                    "relative z-[1] flex w-full flex-col items-center justify-center gap-2 px-4 py-5 text-center",
                    animate &&
                        "animate-in fade-in-0 slide-in-from-bottom-3 duration-400 ease-out",
                )}
            >
                <CelebrationHeroMetric
                    icon={Trophy}
                    iconColor={glow}
                    iconDropShadow={leagueIconDropShadow(glow)}
                    badge={<RankBadge rankId="diamond_1" size="sm" />}
                    badgeClassName="!bg-transparent !p-0 !shadow-none !ring-0 !font-sans !not-italic"
                    ariaLabel={`${UI.leaguePromotionCelebrationTitle}, ${UI.onboardingIntroSceneExercise}`}
                />
                <p className="text-base font-semibold tracking-tight">
                    {UI.leaguePromotionCelebrationTitle}
                </p>
                <p className="text-sm capitalize text-foreground/90">
                    {UI.onboardingIntroSceneExercise}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <RankBadge rankId="platinum_3" size="sm" className="opacity-80" />
                    <ArrowRight
                        className="size-4 shrink-0"
                        style={{ color: glow }}
                        aria-hidden
                    />
                    <RankBadge rankId="diamond_1" size="sm" />
                </div>
                <p className="text-sm text-muted-foreground">{perfLabel}</p>
            </div>
        </div>
    );
}
