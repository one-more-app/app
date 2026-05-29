import { useUserProgressData } from "@/hooks/use-api-data";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";
import { Link } from "react-router-dom";

export function UserProgressBanner({ className }: { className?: string }) {
    const { data: progress } = useUserProgressData();
    if (!progress) return null;

    const pct =
        progress.xpForNextLevel > 0
            ? Math.min(
                100,
                Math.round((progress.xpIntoLevel / progress.xpForNextLevel) * 100),
            )
            : 0;

    return (
        <Link
            to="/profile"
            className={cn(
                "mb-4 block rounded-xl bg-card p-3 outline-none transition-colors",
                "hover:bg-card/90 focus-visible:ring-2 focus-visible:ring-ring",
                className,
            )}
            aria-label={UI.xpBannerGoToProfile}
        >
            <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                        {UI.xpLevelLabel.replace("{level}", String(progress.level))}
                    </span>
                </div>
                {progress.streak.current > 0 ? (
                    <div
                        className="flex items-center gap-1 text-xs font-medium text-orange-500"
                        title={UI.streakLabel}
                    >
                        <Flame className="size-3.5" aria-hidden />
                        {UI.streakDays.replace("{days}", String(progress.streak.current))}
                    </div>
                ) : null}
            </div>
            <div
                className="h-2 overflow-hidden rounded-full bg-secondary"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={UI.xpProgressAria}
            >
                <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
                {UI.xpProgressHint
                    .replace("{current}", String(progress.xpIntoLevel))
                    .replace("{total}", String(progress.xpForNextLevel))}
            </p>
        </Link>
    );
}
