import { ExerciseImage } from "@/components/ExerciseImage";
import { ExerciseTitle } from "@/components/ExerciseTitle";
import { HistoryCollapsedHighlights } from "@/components/history/HistoryCollapsedHighlights";
import { PerfEntryList } from "@/components/history/PerfEntryList";
import { RankBadge } from "@/components/RankBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { hapticImpact } from "@/lib/haptics";
import {
    summarizeExerciseGroupInsights,
    type HistoryEntryInsight,
} from "@/lib/history-entries";
import type { LeagueInfo } from "@/lib/strength-standards";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { PerformanceEntry, TrackedExercise } from "@/types";
import { ChevronDown, Plus } from "lucide-react";
import { useMemo, useState } from "react";

export type HomeExerciseListMode = "live" | "past";

export type HomeExerciseListGroup = {
    trackedExerciseId: string;
    items: PerformanceEntry[];
    exercise: TrackedExercise | undefined;
    league: LeagueInfo | null;
    seriesLabel: string;
};

export type HomeExerciseListProps = {
    mode: HomeExerciseListMode;
    groups: HomeExerciseListGroup[];
    entryInsights: Map<string, HistoryEntryInsight>;
    onOpenExercise: (trackedExerciseId: string) => void;
    onAddSet?: (trackedExerciseId: string) => void;
    onEditEntry?: (entry: PerformanceEntry) => void;
    onDeleteEntry?: (entry: PerformanceEntry) => void;
};

export function HomeExerciseList({
    mode,
    groups,
    entryInsights,
    onOpenExercise,
    onAddSet,
    onEditEntry,
    onDeleteEntry,
}: HomeExerciseListProps) {
    const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

    const toggleExpanded = (trackedExerciseId: string) => {
        void hapticImpact();
        setExpanded((previous) => {
            const next = new Set(previous);
            if (next.has(trackedExerciseId)) next.delete(trackedExerciseId);
            else next.add(trackedExerciseId);
            return next;
        });
    };

    return (
        <Card className="gap-0 py-0">
            <ul className="divide-y divide-border">
                {groups.map(
                    ({
                        trackedExerciseId,
                        items,
                        exercise,
                        league,
                        seriesLabel,
                    }) => {
                        const name = exercise?.name ?? UI.exerciseNotFound;
                        const isOpen = expanded.has(trackedExerciseId);
                        const panelId = `home-${mode}-sets-${trackedExerciseId}`;
                        const canEdit = mode === "live" && !!exercise && !!onEditEntry;
                        const readOnly = mode === "past" || !canEdit;

                        return (
                            <HomeExerciseListItem
                                key={trackedExerciseId}
                                trackedExerciseId={trackedExerciseId}
                                items={items}
                                exercise={exercise}
                                league={league}
                                seriesLabel={seriesLabel}
                                name={name}
                                isOpen={isOpen}
                                panelId={panelId}
                                mode={mode}
                                entryInsights={entryInsights}
                                canEdit={canEdit}
                                readOnly={readOnly}
                                onOpenExercise={onOpenExercise}
                                onToggle={() => toggleExpanded(trackedExerciseId)}
                                onAddSet={onAddSet}
                                onEditEntry={onEditEntry}
                                onDeleteEntry={onDeleteEntry}
                            />
                        );
                    },
                )}
            </ul>
        </Card>
    );
}

type HomeExerciseListItemProps = {
    trackedExerciseId: string;
    items: PerformanceEntry[];
    exercise: TrackedExercise | undefined;
    league: LeagueInfo | null;
    seriesLabel: string;
    name: string;
    isOpen: boolean;
    panelId: string;
    mode: HomeExerciseListMode;
    entryInsights: Map<string, HistoryEntryInsight>;
    canEdit: boolean;
    readOnly: boolean;
    onOpenExercise: (trackedExerciseId: string) => void;
    onToggle: () => void;
    onAddSet?: (trackedExerciseId: string) => void;
    onEditEntry?: (entry: PerformanceEntry) => void;
    onDeleteEntry?: (entry: PerformanceEntry) => void;
};

function HomeExerciseListItem({
    trackedExerciseId,
    items,
    exercise,
    league,
    seriesLabel,
    name,
    isOpen,
    panelId,
    mode,
    entryInsights,
    canEdit,
    readOnly,
    onOpenExercise,
    onToggle,
    onAddSet,
    onEditEntry,
    onDeleteEntry,
}: HomeExerciseListItemProps) {
    const groupHighlights = useMemo(
        () => summarizeExerciseGroupInsights(items, entryInsights),
        [items, entryInsights],
    );

    return (
        <li className="group/coll p-3" data-state={isOpen ? "open" : "closed"}>
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => onOpenExercise(trackedExerciseId)}
                    aria-label={UI.homeLiveOpenExerciseAria.replace("{name}", name)}
                    className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted"
                >
                    <ExerciseImage
                        gifUrl={exercise?.gifUrl}
                        isCustom={exercise?.isCustom}
                        bodyPart={exercise?.bodyPart}
                        target={exercise?.target}
                        className="size-full"
                        imgClassName="size-full object-cover"
                        fallbackIconClassName="size-7 text-muted-foreground"
                    />
                </button>

                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="min-w-0 flex-1 text-left"
                >
                    <ExerciseTitle className="block">{name}</ExerciseTitle>
                    <HistoryCollapsedHighlights
                        seriesLabel={seriesLabel}
                        summary={groupHighlights}
                        trailing={
                            league ? <RankBadge league={league} size="xs" /> : null
                        }
                    />
                </button>

                {mode === "live" ? (
                    <Button
                        type="button"
                        size="icon"
                        onClick={() => onAddSet?.(trackedExerciseId)}
                        disabled={!exercise || !onAddSet}
                        aria-label={UI.homeLiveAddSetAria.replace("{name}", name)}
                        className="size-11 shrink-0 rounded-full bg-black text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85"
                    >
                        <Plus className="size-5" aria-hidden />
                    </Button>
                ) : (
                    <button
                        type="button"
                        onClick={onToggle}
                        aria-hidden
                        tabIndex={-1}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        className="flex size-11 shrink-0 items-center justify-center rounded-full"
                    >
                        <ChevronDown
                            className={cn(
                                "size-5 transition-transform duration-200",
                                isOpen && "rotate-180",
                            )}
                            aria-hidden
                        />
                        <span className="sr-only">{seriesLabel}</span>
                    </button>
                )}
            </div>

            {isOpen ? (
                <PerfEntryList
                    id={panelId}
                    className="mt-3"
                    entries={items}
                    entryInsights={entryInsights}
                    canEdit={canEdit}
                    readOnly={readOnly}
                    onEditEntry={(entry) => onEditEntry?.(entry)}
                    onDeleteEntry={(entry) => onDeleteEntry?.(entry)}
                />
            ) : null}
        </li>
    );
}
