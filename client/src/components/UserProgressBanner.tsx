import { useUserProgressData } from "@/hooks/use-api-data";
import { StreakFlameCount } from "@/components/StreakFlameCount";
import { XpProgressBlock } from "@/components/XpProgressBlock";
import { resolveProgressStreak } from "@/lib/streak-display";
import { isStreakOnGraceDay } from "@one-more/shared/streak-dates";
import { resolveStreakXpBonus } from "@/lib/streak-xp-display";
import { hapticImpact } from "@/lib/haptics";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function UserProgressBanner({ className }: { className?: string }) {
    const { data: progress } = useUserProgressData();
    if (!progress) return null;

    const { current: currentStreak } = resolveProgressStreak(progress);
    const streakXpBonus = resolveStreakXpBonus(progress);
    const onGraceDay =
        progress.streak.current > 0 &&
        !!progress.lastActiveDate &&
        isStreakOnGraceDay(
            progress.lastActiveDate,
            progress.streak.current,
        );

    return (
        <Link
            to="/profile"
            onClick={() => {
                void hapticImpact();
            }}
            className={cn(
                "mb-4 block rounded-xl bg-card p-3 outline-none transition-colors",
                "hover:bg-card/90 focus-visible:ring-2 focus-visible:ring-ring",
                className,
            )}
            aria-label={UI.xpBannerGoToProfile}
        >
            <XpProgressBlock
                level={progress.level}
                xpIntoLevel={progress.xpIntoLevel}
                xpForNextLevel={progress.xpForNextLevel}
                rightSlot={
                    <StreakFlameCount
                        count={currentStreak}
                        onGraceDay={onGraceDay}
                        bonusPercent={streakXpBonus.bonusPercent}
                        size="sm"
                        iconClassName="size-4"
                        textClassName="text-sm font-semibold tabular-nums"
                    />
                }
            />
        </Link>
    );
}
