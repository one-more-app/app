"use client";

import { BodyWeightLabel } from "@/components/landing/BodyWeightLabel";
import { LeagueBadge } from "@/components/landing/LeagueBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { LeagueInfo } from "@/lib/landing-data";
import { UI, translateBodyPart, translateTarget } from "@/lib/landing-data";
import { Dumbbell, Plus, Trophy } from "lucide-react";

export interface ExerciseCardExercise {
    id: string;
    name: string;
    bodyPart?: string;
    target?: string;
    gifUrl?: string;
    isCustom?: boolean;
}

export interface ExerciseCardPerf {
    weight: number;
    reps: number;
}

interface ExerciseCardProps {
    exercise: ExerciseCardExercise;
    lastPerf?: ExerciseCardPerf | null;
    personalBest?: ExerciseCardPerf | null;
    leagueInfo?: LeagueInfo | null;
    /** Callback au clic sur le bouton d'ajout — optionnel sur la landing (no-op) */
    onAddPerf?: () => void;
    onClick?: () => void;
    imageSize?: "sm" | "md";
}

const imageSizes = { sm: "size-12", md: "size-14" } as const;

export function ExerciseCard({
    exercise,
    lastPerf,
    personalBest,
    leagueInfo,
    onAddPerf,
    onClick,
    imageSize = "md",
}: ExerciseCardProps) {
    const sizeClass = imageSizes[imageSize];

    return (
        <Card
            className={
                onClick
                    ? "relative gap-2 cursor-pointer transition-colors hover:bg-muted/50"
                    : "gap-2"
            }
            onClick={onClick}
        >
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                {!exercise.isCustom && exercise.gifUrl ? (
                    <img
                        src={exercise.gifUrl}
                        alt=""
                        className={`${sizeClass} rounded-lg object-cover bg-muted`}
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                        }}
                    />
                ) : (
                    <div
                        className={`${sizeClass} flex items-center justify-center rounded-lg bg-muted`}
                    >
                        <Dumbbell className="size-6 text-accent" />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base capitalize">
                        {exercise.name}
                    </CardTitle>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {(exercise.bodyPart || exercise.target) && (
                            <Badge variant="secondary">
                                {(exercise.bodyPart &&
                                    translateBodyPart(exercise.bodyPart)) ||
                                    (exercise.target && translateTarget(exercise.target)) ||
                                    exercise.bodyPart ||
                                    exercise.target}
                            </Badge>
                        )}
                        {leagueInfo && <LeagueBadge league={leagueInfo} compact />}
                    </div>
                </div>
                {onAddPerf != null && (
                    <Button
                        size="icon-lg"
                        variant="accent"
                        className="shrink-0"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onAddPerf();
                        }}
                        aria-label={UI.newPerf}
                    >
                        <Plus className="size-5" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="border-t">
                <div className="flex gap-4 text-sm">
                    <div className="flex flex-1 flex-col items-start gap-1 rounded-lg border bg-muted/30 p-3">
                        <span className="text-muted-foreground">{UI.last}</span>
                        {lastPerf ? (
                            <span className="flex items-center gap-1">
                                <span className="text-2xl font-bold text-primary">
                                    {lastPerf.weight === 0 ? (
                                        <BodyWeightLabel className="text-2xl font-bold italic text-primary" />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold italic text-primary">
                                                {lastPerf.weight}
                                            </span>
                                            <span className="text-sm font-normal">kg</span>
                                        </div>
                                    )}
                                </span>
                                <span>× {lastPerf.reps} reps</span>
                            </span>
                        ) : (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </div>
                    <div className="flex flex-1 flex-col items-start gap-1 rounded-lg border border-accent bg-accent/10 p-3">
                        <span className="flex items-center gap-1.5 font-medium text-primary">
                            <Trophy className="size-4" />
                            {UI.record}
                        </span>
                        {personalBest ? (
                            <span className="flex items-center gap-1">
                                <span className="text-2xl font-bold text-primary">
                                    {personalBest.weight === 0 ? (
                                        <BodyWeightLabel className="text-2xl font-bold italic text-primary" />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold italic text-primary">
                                                {personalBest.weight}
                                            </span>
                                            <span className="text-sm font-normal">kg</span>
                                        </div>
                                    )}
                                </span>
                                <span>× {personalBest.reps} reps</span>
                            </span>
                        ) : (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
