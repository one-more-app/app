import { HistoryExerciseCollapsible } from '@/components/history/HistoryExerciseCollapsible'
import { formatDayHeading } from '@/lib/history-entries'
import type { HistoryEntryInsight } from '@/lib/history-entries'
import { UI } from '@/lib/translations'
import type { PerformanceEntry, TrackedExercise } from '@/types'

type ExerciseGroup = { trackedExerciseId: string; items: PerformanceEntry[] }

type HistoryDaySectionProps = {
    dayKey: string
    exercises: ExerciseGroup[]
    resolveExercise: (trackedId: string) => TrackedExercise | undefined
    isTrackedActive: (trackedId: string) => boolean
    entryInsights: Map<string, HistoryEntryInsight>
    onEditEntry: (entry: PerformanceEntry) => void
    onDeleteEntry: (entry: PerformanceEntry) => void
}

export function HistoryDaySection({
    dayKey,
    exercises,
    resolveExercise,
    isTrackedActive,
    entryInsights,
    onEditEntry,
    onDeleteEntry,
}: HistoryDaySectionProps) {
    return (
        <li className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">{formatDayHeading(dayKey)}</h2>
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
                        />
                    )
                })}
            </ul>
        </li>
    )
}
