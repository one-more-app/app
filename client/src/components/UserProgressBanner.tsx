import { NotificationFeedControl } from "@/components/notifications/NotificationFeedDrawer";
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
        <Card
            data-tour={dataTour}
            className={cn("mb-4 py-3", className)}
        >
            <CardContent className="relative pt-0">
                <Link
                    to="/profile"
                    onClick={() => {
                        void hapticImpact();
                    }}
                    className="absolute inset-0 z-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={UI.xpBannerGoToProfile}
                />
                <div className="relative z-10 pointer-events-none">
                    <XpProgressBlock
                        level={progress.level}
                        xpIntoLevel={progress.xpIntoLevel}
                        xpForNextLevel={progress.xpForNextLevel}
                        rightSlot={
                            <div className="pointer-events-auto flex items-center gap-1.5">
                                <StreakFlameCount
                                    count={currentStreak}
                                    bonusPercent={streakXpBonus.bonusPercent}
                                    size="sm"
                                    iconClassName="size-4"
                                    textClassName="text-sm font-semibold tabular-nums"
                                />
                                <NotificationFeedControl />
                            </div>
                        }
                    />
                </div>
            </CardContent>
        </Card>
    );
}
