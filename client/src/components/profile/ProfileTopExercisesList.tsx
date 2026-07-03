import { ExerciseImage } from "@/components/ExerciseImage";
import { ExerciseTitle } from "@/components/ExerciseTitle";
import { RankBadge } from "@/components/RankBadge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { formatPerfLabel } from "@/lib/history-entries";
import type { TopExerciseByLeague } from "@/lib/profile-highlights";
import { profileNestedInteractiveClass } from "@/lib/profile-section";
import { UI } from "@/lib/translations";
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
                        const inner = (
                            <>
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-background text-xs font-bold tabular-nums text-muted-foreground">
                                    {index + 1}
                                </span>
                                <div className="size-10 shrink-0 overflow-hidden rounded-md bg-background">
                                    <ExerciseImage
                                        gifUrl={row.exercise.gifUrl}
                                        isCustom={row.exercise.isCustom}
                                        bodyPart={row.exercise.bodyPart}
                                        target={row.exercise.target}
                                        className="size-full"
                                        imgClassName="size-full object-cover"
                                        fallbackIconClassName="size-6 text-muted-foreground"
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <CardTitle>
                                        <ExerciseTitle>{row.exercise.name}</ExerciseTitle>
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
