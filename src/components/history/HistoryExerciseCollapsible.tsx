import { HistoryPerfRow } from '@/components/history/HistoryPerfRow'
import { Card } from '@/components/ui/card'
import { getExerciseImageUrl } from '@/lib/exercisedb'
import type { HistoryEntryInsight } from '@/lib/history-entries'
import { UI } from '@/lib/translations'
import { cn } from '@/lib/utils'
import type { PerformanceEntry, TrackedExercise } from '@/types'
import { ChevronDown, ChevronRight, Dumbbell } from 'lucide-react'
import { Collapsible } from 'radix-ui'
import { Link } from 'react-router-dom'

type HistoryExerciseCollapsibleProps = {
    trackedExerciseId: string
    items: PerformanceEntry[]
    exercise: TrackedExercise | undefined
    stillTracked: boolean
    seriesLabel: string
    entryInsights: Map<string, HistoryEntryInsight>
    onEditEntry: (entry: PerformanceEntry) => void
    onDeleteEntry: (entry: PerformanceEntry) => void
}

export function HistoryExerciseCollapsible({
    trackedExerciseId,
    items,
    exercise,
    stillTracked,
    seriesLabel,
    entryInsights,
    onEditEntry,
    onDeleteEntry,
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
                                    <p className="text-base font-semibold capitalize leading-tight text-foreground">
                                        {title}
                                        {!stillTracked && exercise?.deletedAt ? (
                                            <span className="ml-1 text-xs font-normal normal-case text-muted-foreground">
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
                        {stillTracked ? (
                            <Link
                                to={`/exercise/${trackedExerciseId}`}
                                className="inline-flex items-center border-l border-border px-3 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                                aria-label={UI.historyOpenExerciseSheet}
                            >
                                <ChevronRight className="size-4" aria-hidden />
                            </Link>
                        ) : null}
                    </div>
                    <Collapsible.Content className="data-[state=closed]:hidden">
                        <ul className="space-y-2 border-t border-border p-3">
                            {items.map((entry) => (
                                <HistoryPerfRow
                                    key={entry.id}
                                    entry={entry}
                                    insight={entryInsights.get(entry.id)}
                                    canEdit={canEdit}
                                    onEdit={() => onEditEntry(entry)}
                                    onDelete={() => onDeleteEntry(entry)}
                                />
                            ))}
                        </ul>
                    </Collapsible.Content>
                </Card>
            </Collapsible.Root>
        </li>
    )
}
