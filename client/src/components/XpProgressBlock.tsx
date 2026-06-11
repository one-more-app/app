import { useEffect, useState, type ReactNode } from "react";

import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";

function xpBarPercent(xpIntoLevel: number, xpForNextLevel: number): number {
    if (xpForNextLevel <= 0) return 0;
    return Math.min(100, (xpIntoLevel / xpForNextLevel) * 100);
}

function xpBarPercentRounded(xpIntoLevel: number, xpForNextLevel: number): number {
    if (xpForNextLevel <= 0) return 0;
    return Math.min(
        100,
        Math.round((xpIntoLevel / xpForNextLevel) * 100),
    );
}

export type XpProgressBlockProps = {
    level: number;
    xpIntoLevel: number;
    xpForNextLevel: number;
    animateFromXpIntoLevel?: number;
    rightSlot?: ReactNode;
    footerSlot?: ReactNode;
};

export function XpProgressBlock({
    level,
    xpIntoLevel,
    xpForNextLevel,
    animateFromXpIntoLevel,
    rightSlot,
    footerSlot,
}: XpProgressBlockProps) {
    const targetPct = xpBarPercent(xpIntoLevel, xpForNextLevel);
    const startPct =
        animateFromXpIntoLevel != null
            ? xpBarPercent(animateFromXpIntoLevel, xpForNextLevel)
            : targetPct;
    const isAnimating =
        animateFromXpIntoLevel != null && animateFromXpIntoLevel !== xpIntoLevel;

    const [barPct, setBarPct] = useState(isAnimating ? startPct : targetPct);

    useEffect(() => {
        if (!isAnimating) {
            setBarPct(targetPct);
            return;
        }

        setBarPct(startPct);
        const frame = requestAnimationFrame(() => {
            setBarPct(targetPct);
        });
        return () => cancelAnimationFrame(frame);
    }, [isAnimating, startPct, targetPct]);

    const ariaPct = xpBarPercentRounded(xpIntoLevel, xpForNextLevel);

    return (
        <>
            <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span
                        className="inline-flex items-baseline gap-1 text-xs font-one-more uppercase font-semibold text-muted-foreground italic"
                        aria-label={UI.xpLevelLabel.replace("{level}", String(level))}
                    >
                        {UI.profileLevelLabel}
                        <span className="font-one-more text-base font-bold  tabular-nums leading-none text-primary dark:text-primary-foreground">
                            {level}
                        </span>
                    </span>
                </div>
                {rightSlot}
            </div>
            <div
                className="h-2 overflow-hidden rounded-full bg-secondary"
                role="progressbar"
                aria-valuenow={ariaPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={UI.xpProgressAria}
            >
                <div
                    className={cn(
                        "h-full rounded-full bg-primary dark:bg-primary-foreground",
                        isAnimating
                            ? "transition-[width] duration-700 ease-out"
                            : "transition-all duration-500",
                    )}
                    style={{ width: `${barPct}%` }}
                />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
                {UI.xpProgressHint
                    .replace("{current}", String(xpIntoLevel))
                    .replace("{total}", String(xpForNextLevel))}
            </p>
            {footerSlot}
        </>
    );
}
