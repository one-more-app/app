import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { LEAGUE_COLORS, leagueMapFill } from "@/lib/league-colors";
import type { MuscleLeagueAgg } from "@/lib/muscle-league-stats";
import { muscleTargetToSlug } from "@/lib/muscle-target-to-slug";
import { rankIdLabel, rankIdTier } from "@/lib/rank-display";
import {
    leagueTierToFrenchLabel,
    rankScore,
    rankScoreToRepresentativeRank,
    medianRankScore,
    type LeagueTier,
} from "@/lib/strength-standards";

const LEGEND_TIERS: LeagueTier[] = [
    "bronze",
    "silver",
    "gold",
    "platinum",
    "diamond",
    "legend",
];
import { translateTarget, UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import Body, { type ExtendedBodyPart, type Slug } from "react-muscle-highlighter";
import { Link } from "react-router-dom";

type BodyGender = "male" | "female";

type SlugBucket = {
    avgScore: number;
    muscles: MuscleLeagueAgg[];
};

function aggregateBySlug(byMuscle: MuscleLeagueAgg[]): Map<Slug, SlugBucket> {
    const map = new Map<Slug, { scores: number[]; muscles: MuscleLeagueAgg[] }>();
    for (const m of byMuscle) {
        const slug = muscleTargetToSlug(m.target);
        if (!slug) continue;
        const cur = map.get(slug) ?? { scores: [], muscles: [] };
        for (const row of m.exercises) {
            cur.scores.push(rankScore(row.league));
        }
        cur.muscles.push(m);
        map.set(slug, cur);
    }
    const out = new Map<Slug, SlugBucket>();
    for (const [slug, { scores, muscles }] of map) {
        out.set(slug, { avgScore: medianRankScore(scores), muscles });
    }
    return out;
}

function SingleMuscleDialog({
    muscle,
    onClose,
}: {
    muscle: MuscleLeagueAgg;
    onClose: () => void;
}) {
    return (
        <>
            <DialogHeader>
                <DialogTitle className="capitalize">{translateTarget(muscle.target)}</DialogTitle>
                <DialogDescription className="sr-only">{UI.bodyMapHint}</DialogDescription>
                <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">{UI.bodyMapMuscleAverageTier}</p>
                    <Badge
                        className={`w-fit shrink-0 font-semibold ${LEAGUE_COLORS[rankIdTier(muscle.representativeRank)]}`}
                    >
                        {rankIdLabel(muscle.representativeRank)}
                    </Badge>
                </div>
            </DialogHeader>
            <p className="text-xs font-medium text-muted-foreground">{UI.bodyMapMuscleExercisesHeading}</p>
            <ul className="space-y-1.5 text-sm">
                {muscle.exercises.map((row) => (
                    <li key={row.trackedExerciseId}>
                        <Link
                            to={`/exercise/${row.trackedExerciseId}`}
                            onClick={onClose}
                            className={cn(
                                "flex items-center justify-between gap-2 rounded-md border border-border/80 bg-muted/30 px-3 py-2.5 outline-none transition-colors",
                                "hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring",
                            )}
                        >
                            <span className="min-w-0 truncate font-medium capitalize">{row.name}</span>
                            <Badge className={`shrink-0 text-xs ${LEAGUE_COLORS[row.league.tier]}`}>
                                {row.league.label}
                            </Badge>
                        </Link>
                    </li>
                ))}
            </ul>
            <DialogFooter>
                <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={onClose}
                >
                    {UI.bodyMapClearSelection}
                </Button>
            </DialogFooter>
        </>
    );
}

/**
 * Carte musculaire via `react-muscle-highlighter` (MIT) : homme / femme, face & dos.
 */
export function BodyMuscleLeagueMap({
    byMuscle,
    isDark,
    gender,
    embedded = false,
}: {
    byMuscle: MuscleLeagueAgg[];
    isDark: boolean;
    gender: BodyGender;
    /** Dans une section profil : fond secondary au lieu d’une bordure seule. */
    embedded?: boolean;
}) {
    const [pickedSlug, setPickedSlug] = useState<Slug | null>(null);

    const bySlug = useMemo(() => aggregateBySlug(byMuscle), [byMuscle]);

    const picked = pickedSlug ? (bySlug.get(pickedSlug) ?? null) : null;

    const bodyData: ExtendedBodyPart[] = useMemo(() => {
        const list: ExtendedBodyPart[] = [];
        for (const [slug, { avgScore }] of bySlug) {
            const rank = rankScoreToRepresentativeRank(avgScore);
            list.push({
                slug,
                styles: {
                    fill: leagueMapFill(rankIdTier(rank), isDark),
                },
            });
        }
        return list;
    }, [bySlug, isDark]);

    /** Zones sans donnée ligue : plus clair en thème clair pour mieux se détacher du fond carte. */
    const defaultFill = isDark ? "#3a3a40" : "#f2f4f8";
    const borderColor = isDark ? "oklch(1 0 0 / 14%)" : "oklch(0.55 0 0 / 22%)";

    const handlePartPress = (part: ExtendedBodyPart) => {
        const slug = part.slug;
        if (!slug || !bySlug.has(slug)) return;
        setPickedSlug((prev) => (prev === slug ? null : slug));
    };

    const scale = 0.62;

    return (
        <div className="w-full space-y-3">
            <div
                className={cn(
                    "relative overflow-hidden rounded-xl p-3",
                    embedded ? "bg-secondary" : "rounded-2xl border border-border/80",
                )}
            >
                <div
                    className="mb-1 flex h-2.5 w-full overflow-hidden rounded-full border border-border/40"
                    role="img"
                    aria-label={UI.bodyMapLeagueColorsCaption}
                >
                    {LEGEND_TIERS.map((tier) => (
                        <span
                            key={tier}
                            className="min-w-0 flex-1 border-r border-border/20 last:border-r-0"
                            style={{ backgroundColor: leagueMapFill(tier, isDark) }}
                            title={leagueTierToFrenchLabel(tier)}
                        />
                    ))}
                </div>
                <div className="mb-1 flex items-center justify-between gap-2">
                    <Badge
                        className={`shrink-0 px-2 py-0 text-[10px] font-semibold ${LEAGUE_COLORS.bronze}`}
                    >
                        {leagueTierToFrenchLabel("bronze")}
                    </Badge>
                    <Badge
                        className={`shrink-0 px-2 py-0 text-[10px] font-semibold ${LEAGUE_COLORS.legend}`}
                    >
                        {leagueTierToFrenchLabel("legend")}
                    </Badge>
                </div>
                <p className="mb-3 text-center text-[10px] text-muted-foreground">
                    {UI.bodyMapLeagueColorsCaption}
                </p>

                <div className="flex flex-row flex-nowrap items-end justify-center gap-0 sm:gap-0.5">
                    <div className="flex shrink-0 flex-col items-center gap-1">
                        <span className="text-sm font-semibold text-foreground">{UI.bodyMapFace}</span>
                        <Body
                            data={bodyData}
                            gender={gender}
                            side="front"
                            scale={scale}
                            border={borderColor}
                            defaultFill={defaultFill}
                            defaultStroke="none"
                            onBodyPartPress={handlePartPress}
                        />
                    </div>
                    <div className="flex shrink-0 flex-col items-center gap-1">
                        <span className="text-sm font-semibold text-foreground">{UI.bodyMapBack}</span>
                        <Body
                            data={bodyData}
                            gender={gender}
                            side="back"
                            scale={scale}
                            border={borderColor}
                            defaultFill={'#ffffff'}
                            defaultStroke="none"
                            onBodyPartPress={handlePartPress}
                        />
                    </div>
                </div>
            </div>

            <p className="text-center text-[11px] text-muted-foreground">{UI.bodyMapHint}</p>

            <Dialog
                open={picked !== null}
                onOpenChange={(open) => {
                    if (!open) setPickedSlug(null);
                }}
            >
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md" showCloseButton>
                    {picked ? (
                        picked.muscles.length === 1 ? (
                            <SingleMuscleDialog
                                muscle={picked.muscles[0]!}
                                onClose={() => setPickedSlug(null)}
                            />
                        ) : (
                            <>
                                <DialogHeader>
                                    <DialogTitle>{UI.bodyMapZoneDetail}</DialogTitle>
                                    <DialogDescription className="sr-only">
                                        {UI.bodyMapHint}
                                    </DialogDescription>
                                    <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            {UI.bodyMapZoneAverageTier}
                                        </p>
                                        <Badge
                                            className={`w-fit shrink-0 font-semibold ${LEAGUE_COLORS[rankIdTier(rankScoreToRepresentativeRank(picked.avgScore))]}`}
                                        >
                                            {rankIdLabel(
                                                rankScoreToRepresentativeRank(picked.avgScore),
                                            )}
                                        </Badge>
                                    </div>
                                </DialogHeader>
                                <ul className="space-y-2 text-sm">
                                    {picked.muscles.map((m) => (
                                        <li
                                            key={m.target}
                                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/80 bg-muted/30 px-3 py-2"
                                        >
                                            <span className="font-medium capitalize">
                                                {translateTarget(m.target)}
                                            </span>
                                            <span className="flex items-center gap-2 text-muted-foreground">
                                                <span
                                                    className="size-2.5 shrink-0 rounded-sm border border-border/60"
                                                    style={{
                                                        backgroundColor: leagueMapFill(
                                                            rankIdTier(m.representativeRank),
                                                            isDark,
                                                        ),
                                                    }}
                                                    aria-hidden
                                                />
                                                {rankIdLabel(m.representativeRank)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="w-full sm:w-auto"
                                        onClick={() => setPickedSlug(null)}
                                    >
                                        {UI.bodyMapClearSelection}
                                    </Button>
                                </DialogFooter>
                            </>
                        )
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}
