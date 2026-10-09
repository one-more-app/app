import { RankBadge } from "@/components/RankBadge";
import type {
    SessionRecapSharePayload,
    SessionRecapShareVariant,
} from "@/components/share/SessionRecapShareCard";
import { Card, CardContent } from "@/components/ui/card";
import { shareStoryMeshBackground } from "@/lib/celebration-visual";
import {
    isRecapVariantAvailable,
    RECAP_SHARE_VARIANTS,
} from "@/lib/session-recap-share-data";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { formatRecapNumber } from "./RecapVolumeCard";

const THUMB_LABEL: Record<SessionRecapShareVariant, string> = {
    stats: UI.recapStoryThumbStats,
    muscles: UI.recapStoryThumbMuscles,
    records: UI.recapStoryThumbRecords,
    league: UI.recapStoryThumbLeague,
};

function ThumbContent({
    variant,
    payload,
}: {
    variant: SessionRecapShareVariant;
    payload: SessionRecapSharePayload;
}) {
    switch (variant) {
        case "muscles":
            return (
                <ul className="space-y-0.5">
                    {payload.muscles.slice(0, 3).map((muscle) => (
                        <li
                            key={muscle.slug}
                            className="truncate font-one-more text-[10px] font-bold uppercase italic leading-tight"
                        >
                            {muscle.label}
                        </li>
                    ))}
                </ul>
            );
        case "records":
            return (
                <p className="font-one-more text-[10px] font-bold uppercase italic leading-tight">
                    <span className="text-base tabular-nums text-accent">
                        {payload.recordCount}
                    </span>{" "}
                    {payload.recordCount === 1
                        ? UI.recapStoryRecordsWordOne
                        : UI.recapStoryRecordsWord}
                </p>
            );
        case "league":
            return payload.league ? (
                <div className="space-y-1">
                    <RankBadge league={payload.league.league} size="xs" variant="dark" />
                    <p className="truncate text-[9px] text-white/75">
                        {payload.league.exerciseName}
                    </p>
                </div>
            ) : null;
        default:
            return (
                <p className="font-one-more font-bold italic leading-none tabular-nums">
                    <span className="text-lg">{formatRecapNumber(payload.volume)}</span>
                    <span className="ml-0.5 text-[9px] uppercase">
                        {UI.recapVolumeUnit}
                    </span>
                </p>
            );
    }
}

type RecapShareSectionProps = {
    payload: SessionRecapSharePayload;
    onOpen: (variant: SessionRecapShareVariant) => void;
};

/** « Partager en story » : 4 miniatures + « Tout voir » (captures 40 et 41). */
export function RecapShareSection({ payload, onOpen }: RecapShareSectionProps) {
    return (
        <Card>
            <CardContent className="space-y-3 pt-0">
                <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-one-more text-sm font-bold uppercase italic">
                        {UI.recapStoryTitle}
                    </h2>
                    <button
                        type="button"
                        className="text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => onOpen("stats")}
                        data-analytics-label="recap_share_see_all"
                    >
                        {UI.recapStorySeeAll}
                    </button>
                </div>
                <ul className="grid grid-cols-4 gap-2">
                    {RECAP_SHARE_VARIANTS.map((variant) => {
                        const available = isRecapVariantAvailable(payload, variant);
                        return (
                            <li key={variant} className="min-w-0">
                                <button
                                    type="button"
                                    disabled={!available}
                                    onClick={() => onOpen(variant)}
                                    className={cn(
                                        "group flex w-full flex-col items-center gap-1.5",
                                        !available && "opacity-40",
                                    )}
                                    data-analytics-label={`recap_share_thumb_${variant}`}
                                >
                                    <span
                                        className="relative flex aspect-[9/16] w-full flex-col justify-end overflow-hidden rounded-2xl p-2 text-left text-white"
                                        style={{ background: shareStoryMeshBackground("#dfff5e", true) }}
                                    >
                                        <ThumbContent variant={variant} payload={payload} />
                                    </span>
                                    <span className="text-xs font-medium">
                                        {THUMB_LABEL[variant]}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
}
