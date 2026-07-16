import { HistoryExerciseCollapsible } from '@/components/history/HistoryExerciseCollapsible'
import { SessionTimingLabel } from '@/components/session/SessionTimingLabel'
import type { HistoryEntryInsight } from '@/lib/history-entries'
import { formatDayHeading } from '@/lib/history-entries'
import { UI } from '@/lib/translations'
import type { PerformanceEntry, TrackedExercise } from '@/types'
import { ChevronRight } from 'lucide-react'
import { useMemo } from 'react'

type ExerciseGroup = { trackedExerciseId: string; items: PerformanceEntry[] }

type HistoryDaySectionProps = {
    dayKey: string
    exercises: ExerciseGroup[]
    dayEntries?: PerformanceEntry[]
    isPresenceTraining?: boolean
    resolveExercise: (trackedId: string) => TrackedExercise | undefined
    isTrackedActive: (trackedId: string) => boolean
    entryInsights: Map<string, HistoryEntryInsight>
    onEditEntry: (entry: PerformanceEntry) => void
    onDeleteEntry: (entry: PerformanceEntry) => void
    onAddEntry?: (trackedExerciseId: string, dayKey: string) => void
    onDayClick?: (dayKey: string) => void
    hideDayHeading?: boolean
    readOnly?: boolean
    surface?: 'card' | 'profile'
}

export function HistoryDaySection({
    dayKey,
    exercises,
    dayEntries,
    isPresenceTraining,
    resolveExercise,
    isTrackedActive,
    entryInsights,
    onEditEntry,
    onDeleteEntry,
    onAddEntry,
    onDayClick,
    hideDayHeading = false,
    readOnly = false,
    surface = 'card',
}: HistoryDaySectionProps) {
    const entriesForTiming = useMemo(
        () =>
            dayEntries ??
            exercises.flatMap(({ items }) => items),
        [dayEntries, exercises],
    )

    return (
        <li className="space-y-3">
            {!hideDayHeading ? (
                onDayClick ? (
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-row gap-1">
                            <h2 className="text-xs font-semibold text-foreground">
                                {formatDayHeading(dayKey)}
                            </h2>
                            <div className="text-xs text-muted-foreground font-one-more">/</div>
                            <SessionTimingLabel
                                entries={entriesForTiming}
                                dayKey={dayKey}
                                isPresenceTraining={isPresenceTraining}
                            />
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                            <button
                                type="button"
                                onClick={() => onDayClick(dayKey)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"
                            >
                                {UI.sessionViewDay}
                                <ChevronRight className="size-3.5" aria-hidden />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start justify-between gap-2">
                        <h2 className="text-sm font-semibold text-foreground">
                            {formatDayHeading(dayKey)}
                        </h2>
                        <SessionTimingLabel
                            entries={entriesForTiming}
                            dayKey={dayKey}
                            isPresenceTraining={isPresenceTraining}
                        />
                    </div>
                )
            ) : null}
            <ul className="space-y-3">
                {exercises.map(({ trackedExerciseId, items }) => {
                    const ex = resolveExercise(trackedExerciseId)
                    const stillTracked = isTrackedActive(trackedExerciseId)
                    const seriesLabel = UI.historySeriesCount.replace(
                        '{count}',
                        String(items.length),
                    )

                    return (
                        <HistoryExerciseCollapsible
                            key={`${dayKey}-${trackedExerciseId}`}
                            trackedExerciseId={trackedExerciseId}
                            items={items}
                            exercise={ex}
                            stillTracked={stillTracked}
                            seriesLabel={seriesLabel}
                            entryInsights={entryInsights}
                            onEditEntry={onEditEntry}
                            onDeleteEntry={onDeleteEntry}
                            onAddEntry={
                                onAddEntry
                                    ? () => onAddEntry(trackedExerciseId, dayKey)
                                    : undefined
                            }
                            readOnly={readOnly}
                            surface={surface}
                        />
                    )
                })}
            </ul>
        </li>
    )
}
