import {
    CelebrationHeroMetric,
    leagueIconDropShadow,
} from "@/components/celebration-modal-ui";
import { ExerciseTitle } from "@/components/ExerciseTitle";
import {
    OnboardingDemoExerciseHeader,
    OnboardingSceneStage,
} from "@/components/onboarding/OnboardingSceneStage";
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
        <OnboardingSceneStage>
            <OnboardingDemoExerciseHeader
                lastWeight={100}
                lastReps={5}
                recordWeight={100}
                recordReps={5}
            />

            <div className="absolute inset-0 bg-black/50" />

            <div className="absolute inset-x-3 bottom-3 top-3 overflow-hidden rounded-xl border bg-background shadow-lg">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background: leagueCelebrationRadialBackground(glow),
                    }}
                />
                <div
                    className={cn(
                        "relative z-[1] flex h-full flex-col items-center justify-center gap-2 px-4 py-4 text-center",
                        animate && "league-promo-ring-anim",
                    )}
                    style={{ ["--league-glow" as string]: glow }}
                >
                    <CelebrationHeroMetric
                        icon={Trophy}
                        iconColor={glow}
                        iconDropShadow={leagueIconDropShadow(glow)}
                        badge={<RankBadge rankId="diamond_1" size="sm" />}
                        badgeClassName="!bg-transparent !p-0 !shadow-none !ring-0 !font-sans !not-italic"
                        ariaLabel={`${UI.leaguePromotionCelebrationTitle}, ${UI.onboardingIntroSceneExercise}`}
                    />
                    <p
                        className={cn(
                            "text-lg font-semibold tracking-tight",
                            animate &&
                                "animate-in fade-in-0 slide-in-from-bottom-2 duration-350 ease-out [animation-delay:120ms] [animation-fill-mode:both]",
                        )}
                    >
                        {UI.leaguePromotionCelebrationTitle}
                    </p>
                    <ExerciseTitle
                        as="p"
                        className={cn(
                            "max-w-full text-sm capitalize text-foreground/90",
                            animate &&
                                "animate-in fade-in-0 slide-in-from-bottom-2 duration-350 ease-out [animation-delay:180ms] [animation-fill-mode:both]",
                        )}
                    >
                        {UI.onboardingIntroSceneExercise}
                    </ExerciseTitle>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                        <span
                            className={cn(
                                animate &&
                                    "animate-in fade-in-0 slide-in-from-left-2 duration-300 ease-out [animation-delay:240ms] [animation-fill-mode:both]",
                            )}
                        >
                            <RankBadge
                                rankId="platinum_3"
                                size="sm"
                                className="opacity-80"
                            />
                        </span>
                        <ArrowRight
                            className={cn(
                                "size-4 shrink-0",
                                animate && "league-promo-nudge-anim",
                            )}
                            style={{ color: glow }}
                            aria-hidden
                        />
                        <span
                            className={cn(
                                animate &&
                                    "animate-in fade-in-0 slide-in-from-right-2 duration-350 ease-out [animation-delay:360ms] [animation-fill-mode:both]",
                            )}
                        >
                            <RankBadge rankId="diamond_1" size="sm" />
                        </span>
                    </div>
                    <p
                        className={cn(
                            "text-sm text-muted-foreground",
                            animate &&
                                "animate-in fade-in-0 slide-in-from-bottom-1 duration-300 ease-out [animation-delay:420ms] [animation-fill-mode:both]",
                        )}
                    >
                        {perfLabel}
                    </p>
                </div>
            </div>
        </OnboardingSceneStage>
    );
}
