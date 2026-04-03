import { PerfEntryList } from '@/components/history/PerfEntryList'
import { Card } from '@/components/ui/card'
import { getExerciseImageUrl } from '@/lib/exercisedb'
import type { HistoryEntryInsight } from '@/lib/history-entries'
import { UI } from '@/lib/translations'
import { cn } from '@/lib/utils'
import type { PerformanceEntry, TrackedExercise } from '@/types'
import { ChevronDown, Dumbbell } from 'lucide-react'
import { Collapsible } from 'radix-ui'

type HistoryExerciseCollapsibleProps = {
    trackedExerciseId: string
    items: PerformanceEntry[]
    exercise: TrackedExercise | undefined
    stillTracked: boolean
    seriesLabel: string
    entryInsights: Map<string, HistoryEntryInsight>
    onEditEntry: (entry: PerformanceEntry) => void
    onDeleteEntry: (entry: PerformanceEntry) => void
    /** Ouvre l’ajout d’une perf pour ce jour et cet exercice (ex. depuis l’historique global). */
    onAddEntry?: () => void
}

export function HistoryExerciseCollapsible({
    trackedExerciseId: _trackedExerciseId,
    items,
    exercise,
    stillTracked,
    seriesLabel,
    entryInsights,
    onEditEntry,
    onDeleteEntry,
    onAddEntry,
}: HistoryExerciseCollapsibleProps) {
    const title = exercise?.name ?? UI.exerciseNotFound
    const showGif =
        exercise &&
        !exercise.isCustom &&
        Boolean(exercise.gifUrl?.trim())
    const canEdit = !!exercise

    return (
        <li>
            <Collapsible.Root className="group/coll">
                <Card className="overflow-hidden py-0">
                    <div className="flex items-stretch">
                        <Collapsible.Trigger asChild>
                            <button
                                type="button"
                                className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left transition-colors hover:bg-muted/40"
                            >
                                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Dumbbell className="size-6" />
                                    </div>
                                    {showGif ? (
                                        <img
                                            src={getExerciseImageUrl(exercise.gifUrl)}
                                            alt=""
                                            className="relative z-10 size-12 object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.visibility = 'hidden'
                                            }}
                                        />
                                    ) : null}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="flex min-w-0 items-baseline gap-1 text-base font-semibold capitalize leading-tight text-foreground">
                                        <span className="min-w-0 flex-1 truncate">{title}</span>
                                        {!stillTracked && exercise?.deletedAt ? (
                                            <span className="shrink-0 text-xs font-normal normal-case text-muted-foreground">
                                                ({UI.exerciseRemovedFromTracking})
                                            </span>
                                        ) : null}
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">{seriesLabel}</p>
                                </div>
                                <ChevronDown
                                    className={cn(
                                        'size-5 shrink-0 text-muted-foreground transition-transform duration-200',
                                        'group-data-[state=open]/coll:rotate-180',
                                    )}
                                    aria-hidden
                                />
                            </button>
                        </Collapsible.Trigger>
                    </div>
                    <Collapsible.Content className="data-[state=closed]:hidden">
                        <PerfEntryList
                            listClassName="px-3 pb-3 pt-2"
                            entries={items}
                            entryInsights={entryInsights}
                            canEdit={canEdit}
                            onEditEntry={onEditEntry}
                            onDeleteEntry={onDeleteEntry}
                            onAddSet={
                                canEdit && onAddEntry ? onAddEntry : undefined
                            }
                        />
                    </Collapsible.Content>
                </Card>
            </Collapsible.Root>
        </li>
    )
}
