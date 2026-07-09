import { useUserProgressData } from "@/hooks/use-api-data";
import { StreakFlameCount } from "@/components/StreakFlameCount";
import { XpProgressBlock } from "@/components/XpProgressBlock";
import { Card, CardContent } from "@/components/ui/card";
import { resolveProgressStreak } from "@/lib/streak-display";
import { resolveStreakXpBonus } from "@/lib/streak-xp-display";
import { hapticImpact } from "@/lib/haptics";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function UserProgressBanner({
    className,
    dataTour,
}: {
    className?: string
    dataTour?: string
}) {
    const { data: progress } = useUserProgressData();
    if (!progress) return null;

    const { current: currentStreak } = resolveProgressStreak(progress);
    const streakXpBonus = resolveStreakXpBonus(progress);

    return (
        <Link
            to="/profile"
            data-tour={dataTour}
            onClick={() => {
                void hapticImpact();
            }}
            className={cn(
                "mb-4 block outline-none transition-colors",
                "hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring",
                className,
            )}
            aria-label={UI.xpBannerGoToProfile}
        >
            <Card className="py-3">
                <CardContent className="pt-0">
                    <XpProgressBlock
                        level={progress.level}
                        xpIntoLevel={progress.xpIntoLevel}
                        xpForNextLevel={progress.xpForNextLevel}
                        rightSlot={
                            <StreakFlameCount
                                count={currentStreak}
                                bonusPercent={streakXpBonus.bonusPercent}
                                size="sm"
                                iconClassName="size-4"
                                textClassName="text-sm font-semibold tabular-nums"
                            />
                        }
                    />
                </CardContent>
            </Card>
        </Link>
    );
}
