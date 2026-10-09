import { ExerciseImage } from "@/components/ExerciseImage";
import { ExerciseTitle } from "@/components/ExerciseTitle";
import { RankBadge } from "@/components/RankBadge";
import { ReactionBubbles } from "@/components/session/ReactionBubbles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPerfLabel, type HistoryEntryInsight } from "@/lib/history-entries";
import { hapticImpact } from "@/lib/haptics";
import type { ReactionBubble } from "@/lib/session-api";
import type { LeagueInfo } from "@/lib/strength-standards";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import type { PerformanceEntry, TrackedExercise } from "@/types";
import { ChevronDown, Pencil, Plus } from "lucide-react";
import { useState } from "react";

export type HomeExerciseListMode = "live" | "past";

export type HomeExerciseListGroup = {
  trackedExerciseId: string;
  items: PerformanceEntry[];
  exercise: TrackedExercise | undefined;
  league: LeagueInfo | null;
  seriesLabel: string;
  reactions?: ReactionBubble[];
};

export type HomeExerciseListProps = {
  mode: HomeExerciseListMode;
  groups: HomeExerciseListGroup[];
  entryInsights: Map<string, HistoryEntryInsight>;
  onOpenExercise: (trackedExerciseId: string) => void;
  onAddSet?: (trackedExerciseId: string) => void;
  onEditEntry?: (entry: PerformanceEntry) => void;
  currentUserId?: string | null;
  onToggleReaction?: (trackedExerciseId: string, emoji: string) => void;
};

export function HomeExerciseList({
  mode,
  groups,
  entryInsights,
  onOpenExercise,
  onAddSet,
  onEditEntry,
  currentUserId,
  onToggleReaction,
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
            reactions,
          }) => {
            const name = exercise?.name ?? UI.exerciseNotFound;
            const isOpen = expanded.has(trackedExerciseId);
            const panelId = `home-${mode}-sets-${trackedExerciseId}`;

            return (
              <li key={trackedExerciseId} className="p-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenExercise(trackedExerciseId)}
                    aria-label={UI.homeLiveOpenExerciseAria.replace(
                      "{name}",
                      name,
                    )}
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
                    onClick={() => toggleExpanded(trackedExerciseId)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="min-w-0 flex-1 text-left"
                  >
                    <ExerciseTitle className="block">{name}</ExerciseTitle>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs text-muted-foreground">
                        {seriesLabel}
                      </span>
                      {league ? <RankBadge league={league} size="xs" /> : null}
                    </span>
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
                      onClick={() => toggleExpanded(trackedExerciseId)}
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
                  <ol id={panelId} className="mt-3 space-y-2">
                    {items.map((entry, index) => {
                      const insight = entryInsights.get(entry.id);
                      return (
                        <li
                          key={entry.id}
                          className="flex items-center gap-3 rounded-xl bg-secondary/60 px-3 py-2.5"
                        >
                          <span className="w-4 shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1 font-one-more text-sm font-semibold uppercase italic tracking-tight">
                            {formatPerfLabel(entry.weight, entry.reps)}
                          </span>
                          {insight?.isRecord ? (
                            <span className="accent-text shrink-0 rounded-full py-0.5 text-[11px] font-semibold dark:bg-accent/15 dark:px-2">
                              {UI.record}
                            </span>
                          ) : null}
                          {mode === "live" && onEditEntry ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={!exercise}
                              onClick={() => onEditEntry(entry)}
                              aria-label={UI.modifyPerf}
                              className="size-8 shrink-0 rounded-full bg-background"
                            >
                              <Pencil className="size-4" aria-hidden />
                            </Button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                ) : null}

                {reactions?.length ? (
                  <ReactionBubbles
                    reactions={reactions}
                    currentUserId={currentUserId}
                    disabled={!onToggleReaction}
                    onToggle={(emoji) =>
                      onToggleReaction?.(trackedExerciseId, emoji)
                    }
                    className="pt-2"
                  />
                ) : null}
              </li>
            );
          },
        )}
      </ul>
    </Card>
  );
}
