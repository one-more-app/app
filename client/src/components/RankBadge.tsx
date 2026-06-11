import { LEAGUE_ACCENT_CLASS } from "@/lib/league-colors";
import {
    leagueTierToFrenchLabel,
    parseRankId,
    type LeagueInfo,
    type LeagueTier,
    type RankId,
} from "@/lib/strength-standards";
import { cn } from "@/lib/utils";

type RankBadgeSize = "xs" | "sm" | "md" | "lg" | "xl";
type RankBadgeVariant = "auto" | "light" | "dark";

const PILL_VARIANT: Record<RankBadgeVariant, string> = {
    light: "border-border/80 bg-white",
    dark: "border-transparent bg-black",
    auto: "border-border/80 bg-white dark:border-transparent dark:bg-black",
};

const TIER_TEXT_VARIANT: Record<RankBadgeVariant, string> = {
    light: "text-foreground",
    dark: "text-white",
    auto: "text-foreground dark:text-white",
};

const SIZE_CLASSES: Record<
    RankBadgeSize,
    { pill: string; tier: string; sub: string }
> = {
    xs: {
        pill: "h-5 gap-0.5 px-2",
        tier: "text-[10px]",
        sub: "text-[10px]",
    },
    sm: {
        pill: "h-5 gap-0.5 px-2",
        tier: "text-[10px]",
        sub: "text-[10px]",
    },
    md: {
        pill: "h-6 gap-1 px-2.5",
        tier: "text-xs",
        sub: "text-xs",
    },
    lg: {
        pill: "h-8 gap-1 px-4",
        tier: "text-sm",
        sub: "text-sm",
    },
    xl: {
        pill: "h-11 gap-1.5 px-6",
        tier: "text-xl",
        sub: "text-xl",
    },
};

const SUB_RANK_ROMAN: Record<1 | 2 | 3, string> = {
    1: "I",
    2: "II",
    3: "III",
};

type RankBadgeProps = {
    league?: LeagueInfo;
    rankId?: RankId;
    tier?: LeagueTier;
    subRank?: 1 | 2 | 3 | null;
    size?: RankBadgeSize;
    /** Thème visuel explicite (cartes de partage sans classe `dark` sur le document). */
    variant?: RankBadgeVariant;
    className?: string;
};

function resolveRank(
    props: RankBadgeProps,
): { tier: LeagueTier; subRank: 1 | 2 | 3 | null } {
    if (props.league) {
        return { tier: props.league.tier, subRank: props.league.subRank };
    }
    if (props.rankId) {
        return parseRankId(props.rankId);
    }
    if (props.tier) {
        return { tier: props.tier, subRank: props.subRank ?? null };
    }
    throw new Error("RankBadge requires league, rankId, or tier");
}

export function RankBadge({
    size = "sm",
    variant = "auto",
    className,
    ...props
}: RankBadgeProps) {
    const { tier, subRank } = resolveRank(props);
    const isLegend = tier === "legend";
    const accentClass = LEAGUE_ACCENT_CLASS[tier];
    const sizes = SIZE_CLASSES[size];
    const tierLabel = leagueTierToFrenchLabel(tier).toUpperCase();

    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-full border leading-none",
                isLegend
                    ? "border-transparent bg-accent"
                    : PILL_VARIANT[variant],
                sizes.pill,
                className,
            )}
        >
            <span className="inline-flex items-center gap-0.5 leading-none">
                <span
                    className={cn(
                        "font-one-more font-bold uppercase tracking-wide leading-none",
                        isLegend ? "text-accent-foreground" : TIER_TEXT_VARIANT[variant],
                        sizes.tier,
                    )}
                >
                    {tierLabel}
                </span>
                {subRank != null ? (
                    <span
                        className={cn(
                            "font-one-more font-bold italic leading-none",
                            accentClass,
                            sizes.sub,
                        )}
                    >
                        {SUB_RANK_ROMAN[subRank]}
                    </span>
                ) : null}
            </span>
        </span>
    );
}
