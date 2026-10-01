import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import type { RankingRecapResponse } from "@/lib/ranking-api";
import { formatRankingMonthLabel } from "@/lib/ranking-month";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { CalendarDays, Dumbbell, Trophy, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

type RankingRecapSheetProps = {
    recap: RankingRecapResponse | null;
    open: boolean;
    onDismiss: () => void;
};

function rankingGymBadgeLabel(tier: string, month: string): string {
    const monthLabel = formatRankingMonthLabel(month);
    if (tier === "top1") return UI.badgeRankingGymTop1.replace("{month}", monthLabel);
    if (tier === "top3") return UI.badgeRankingGymTop3.replace("{month}", monthLabel);
    if (tier === "top10") return UI.badgeRankingGymTop10.replace("{month}", monthLabel);
    return UI.badgeRankingGymTop50.replace("{month}", monthLabel);
}

function badgeChipClass(tier: string): string {
    if (tier === "top1") {
        return "bg-amber-200 text-amber-950 dark:bg-amber-600/50 dark:text-amber-100";
    }
    if (tier === "top3") {
        return "bg-slate-200 text-slate-900 dark:bg-slate-600/50 dark:text-slate-200";
    }
    if (tier === "top10") {
        return "bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-200";
    }
    return "bg-secondary text-foreground";
}

function StatTile({
    icon: Icon,
    label,
    value,
    hint,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    hint?: string;
}) {
    return (
        <div className="rounded-xl bg-secondary px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <Icon className="size-3 shrink-0" aria-hidden />
                <p className="text-[10px] font-one-more uppercase italic tracking-wide">
                    {label}
                </p>
            </div>
            <p className="mt-1 text-lg font-semibold tabular-nums leading-none">
                {value}
            </p>
            {hint ? (
                <p className="mt-1 truncate text-[11px] text-muted-foreground">{hint}</p>
            ) : null}
        </div>
    );
}

export function RankingRecapSheet({
    recap,
    open,
    onDismiss,
}: RankingRecapSheetProps) {
    const monthLabel = recap ? formatRankingMonthLabel(recap.month) : "";

    return (
        <Drawer
            open={open && recap != null}
            data-analytics-label="ranking-recap"
            onOpenChange={(next) => {
                if (!next) onDismiss();
            }}
        >
            <DrawerContent className="max-h-[92vh]">
                {recap ? (
                    <div className="mx-auto w-full max-w-lg overflow-y-auto px-4 pb-7">
                        <DrawerHeader className="space-y-1 px-0 pb-3 text-left">
                            <p className="font-one-more text-[10px] font-semibold uppercase italic tracking-wide text-muted-foreground">
                                {UI.rankingRecapEyebrow}
                            </p>
                            <DrawerTitle className="text-base capitalize">
                                {UI.rankingRecapTitle.replace("{month}", monthLabel)}
                            </DrawerTitle>
                            <DrawerDescription className="sr-only">
                                {UI.rankingRecapBody
                                    .replace(
                                        "{xp}",
                                        recap.xp.toLocaleString("fr-FR"),
                                    )
                                    .replace("{days}", String(recap.activeDays))}
                            </DrawerDescription>
                        </DrawerHeader>

                        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-card px-3 py-3">
                            <div>
                                <p className="font-one-more text-[10px] font-semibold uppercase italic text-muted-foreground">
                                    {UI.rankingRecapXpLabel}
                                </p>
                                <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight">
                                    +{recap.xp.toLocaleString("fr-FR")}
                                </p>
                            </div>
                            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                                {UI.rankingRecapDaysLabel.replace(
                                    "{days}",
                                    String(recap.activeDays),
                                )}
                            </p>
                        </div>

                        {(recap.friends || recap.gym) && (
                            <div
                                className={cn(
                                    "mb-3 grid gap-2",
                                    recap.friends && recap.gym
                                        ? "grid-cols-2"
                                        : "grid-cols-1",
                                )}
                            >
                                {recap.friends ? (
                                    <StatTile
                                        icon={Users}
                                        label={UI.rankingTabFriends}
                                        value={`#${recap.friends.rank}`}
                                        hint={UI.rankingRecapOutOf.replace(
                                            "{total}",
                                            String(recap.friends.total),
                                        )}
                                    />
                                ) : null}
                                {recap.gym ? (
                                    <StatTile
                                        icon={Dumbbell}
                                        label={UI.rankingTabGym}
                                        value={`#${recap.gym.rank}`}
                                        hint={UI.rankingRecapOutOf.replace(
                                            "{total}",
                                            String(recap.gym.total),
                                        )}
                                    />
                                ) : null}
                            </div>
                        )}

                        {recap.badge?.kind === "ranking_gym" ? (
                            <div className="mb-4 space-y-1.5">
                                <p className="font-one-more text-[10px] font-semibold uppercase italic text-muted-foreground">
                                    {UI.rankingRecapBadgeTitle}
                                </p>
                                {recap.badge.deeplink ? (
                                    <Link
                                        to={recap.badge.deeplink}
                                        onClick={onDismiss}
                                        className={cn(
                                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-90",
                                            badgeChipClass(recap.badge.tier),
                                        )}
                                    >
                                        <Trophy className="size-3 shrink-0" aria-hidden />
                                        {rankingGymBadgeLabel(
                                            recap.badge.tier,
                                            recap.month,
                                        )}
                                    </Link>
                                ) : (
                                    <span
                                        className={cn(
                                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                                            badgeChipClass(recap.badge.tier),
                                        )}
                                    >
                                        <Trophy className="size-3 shrink-0" aria-hidden />
                                        {rankingGymBadgeLabel(
                                            recap.badge.tier,
                                            recap.month,
                                        )}
                                    </span>
                                )}
                            </div>
                        ) : null}

                        <Button className="w-full" onClick={onDismiss}>
                            {UI.rankingRecapCta}
                        </Button>
                    </div>
                ) : null}
            </DrawerContent>
        </Drawer>
    );
}
