import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { streakXpBonusPercent } from "@one-more/shared/streak-xp-multiplier";
import { Flame } from "lucide-react";

type StreakFlameCountProps = {
    count: number;
    className?: string;
    iconClassName?: string;
    textClassName?: string;
    bonusPercent?: number;
    bonusClassName?: string;
    showBonus?: boolean;
    size?: "sm" | "md" | "lg";
};

const bonusSizeClasses: Record<NonNullable<StreakFlameCountProps["size"]>, string> = {
    sm: "px-1.5 py-0.5 text-[0.65rem] leading-none",
    md: "px-2 py-0.5 text-xs leading-none",
    lg: "px-3 py-1 text-[2rem] leading-none",
};

export function StreakFlameCount({
    count,
    className,
    iconClassName = "size-3.5",
    textClassName = "text-xs font-semibold tabular-nums",
    bonusPercent,
    bonusClassName,
    showBonus = true,
    size = "md",
}: StreakFlameCountProps) {
    if (count <= 0) return null;

    const resolvedBonus = bonusPercent ?? streakXpBonusPercent(count);
    const bonusLabel =
        showBonus && resolvedBonus > 0
            ? UI.streakXpBonusLabel.replace("{percent}", String(resolvedBonus))
            : null;

    return (
        <div
            className={cn("flex items-center gap-2 text-orange-500", className)}
            title={UI.streakRuleHint}
            aria-label={
                bonusLabel
                    ? `${UI.streakDays.replace("{days}", String(count))} · ${bonusLabel}`
                    : UI.streakDays.replace("{days}", String(count))
            }
        >
            <div className="flex items-center gap-1">
                <Flame className={cn(iconClassName, "shrink-0")} aria-hidden />
                <span className={textClassName}>{count}</span>
            </div>
            {bonusLabel ? (
                <span
                    className={cn(
                        "inline-flex shrink-0 items-center rounded-full border font-extrabold tabular-nums tracking-tight",
                        "border-orange-500 bg-orange-500/10 text-orange-500",
                        "dark:border-orange-500 dark:bg-orange-500/10 dark:text-orange-500",
                        bonusSizeClasses[size],
                        bonusClassName,
                    )}
                >
                    {bonusLabel}
                </span>
            ) : null}
        </div>
    );
}
