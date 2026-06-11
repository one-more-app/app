import { RankBadge } from "@/components/RankBadge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { getExerciseImageUrl } from "@/lib/exercisedb";
import { formatPerfLabel } from "@/lib/history-entries";
import type { TopExerciseByLeague } from "@/lib/profile-highlights";
import { profileNestedInteractiveClass } from "@/lib/profile-section";
import { UI } from "@/lib/translations";
import { Dumbbell } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const TOP_VISIBLE = 5;

export function ProfileTopExercisesList({
    ranked,
    readOnly = false,
}: {
    ranked: TopExerciseByLeague[];
    readOnly?: boolean;
}) {
    const [expanded, setExpanded] = useState(false);

    if (ranked.length === 0) return null;

    const visible = expanded ? ranked : ranked.slice(0, TOP_VISIBLE);
    const hasMore = ranked.length > TOP_VISIBLE;

    return (
        <Card>
            <CardHeader className="pb-0">
                <CardTitle>{UI.profileTopExercisesTitle}</CardTitle>
            </CardHeader>
            <CardContent>
                <ol className="space-y-2">
                    {visible.map((row, index) => {
                        const showGif =
                            !row.exercise.isCustom && Boolean(row.exercise.gifUrl?.trim());

                        const inner = (
                            <>
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-background text-xs font-bold tabular-nums text-muted-foreground">
                                    {index + 1}
                                </span>
                                <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-background">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Dumbbell className="size-4 text-muted-foreground" aria-hidden />
                                    </div>
                                    {showGif ? (
                                        <img
                                            src={getExerciseImageUrl(row.exercise.gifUrl)}
                                            alt=""
                                            className="relative z-10 size-10 object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.visibility = "hidden";
                                            }}
                                        />
                                    ) : null}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <CardTitle>
                                        {row.exercise.name}
                                    </CardTitle>
                                    <p className="text-xs tabular-nums text-muted-foreground">
                                        {formatPerfLabel(
                                            row.personalBest.weight,
                                            row.personalBest.reps,
                                        )}
                                    </p>
                                </div>
                                <RankBadge league={row.league} size="sm" />
                            </>
                        );

                        return (
                            <li key={row.exercise.id}>
                                {readOnly ? (
                                    <div
                                        className={`flex items-center gap-2.5 px-3 py-2.5 ${profileNestedInteractiveClass}`}
                                    >
                                        {inner}
                                    </div>
                                ) : (
                                    <Link
                                        to={`/exercise/${row.exercise.id}`}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 ${profileNestedInteractiveClass}`}
                                    >
                                        {inner}
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ol>
                {hasMore ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full text-muted-foreground"
                        onClick={() => setExpanded((e) => !e)}
                    >
                        {expanded
                            ? UI.profileSeeLess
                            : UI.profileSeeMore.replace(
                                "{count}",
                                String(ranked.length - TOP_VISIBLE),
                            )}
                    </Button>
                ) : null}
            </CardContent>
        </Card>
    );
}
