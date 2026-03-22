import { AddPerfDrawer } from '@/components/AddPerfDrawer'
import { BackHeader } from '@/components/BackHeader'
import { HistoryDaySection } from '@/components/history/HistoryDaySection'
import { Card, CardContent } from '@/components/ui/card'
import {
    buildEntryInsights,
    groupByDayThenExercise,
    resolveTrackedExercise,
} from '@/lib/history-entries'
import {
    deletePerformance,
    getAllPerformanceEntriesRecentFirst,
    getTrackedExerciseById,
    getUserProfile,
    updatePerformance,
} from '@/lib/storage'
import { UI } from '@/lib/translations'
import type { PerformanceEntry } from '@/types'
import { useCallback, useEffect, useMemo, useState } from 'react'

const MAX_SHOWN = 150

export function HistoryPage() {
    const [entries, setEntries] = useState<PerformanceEntry[]>(() =>
        getAllPerformanceEntriesRecentFirst(),
    )
    const [editEntry, setEditEntry] = useState<PerformanceEntry | null>(null)

    const reload = useCallback(() => {
        setEntries(getAllPerformanceEntriesRecentFirst())
    }, [])

    useEffect(() => {
        reload()
        const onSync = () => reload()
        const onLocal = (e: Event) => {
            const kind = (e as CustomEvent<{ kind?: string }>).detail?.kind
            if (kind === 'performance') reload()
        }
        window.addEventListener('one-more:synced', onSync)
        window.addEventListener('one-more:local-data-changed', onLocal)
        return () => {
            window.removeEventListener('one-more:synced', onSync)
            window.removeEventListener('one-more:local-data-changed', onLocal)
        }
    }, [reload])

    const shown = useMemo(() => entries.slice(0, MAX_SHOWN), [entries])
    const shownByDayThenExercise = useMemo(
        () => groupByDayThenExercise(shown),
        [shown],
    )
    const truncated = entries.length > MAX_SHOWN

    const profile = getUserProfile()
    const entryInsights = useMemo(
        () => buildEntryInsights(entries, profile),
        [entries, profile.weightKg, profile.heightCm, profile.gender],
    )

    const editExercise = editEntry
        ? resolveTrackedExercise(editEntry.trackedExerciseId)
        : undefined

    const handleDeleteEntry = useCallback(
        (entry: PerformanceEntry) => {
            if (confirm(UI.confirmDeletePerf)) {
                deletePerformance(entry.id)
                reload()
            }
        },
        [reload],
    )

    return (
        <div className="min-h-screen bg-background">
            <BackHeader title={UI.history} />

            <main className="mx-auto max-w-2xl space-y-4 p-4 pb-2">
                {truncated && (
                    <p className="text-xs text-muted-foreground">
                        {UI.historyTruncated
                            .replace('{shown}', String(MAX_SHOWN))
                            .replace('{total}', String(entries.length))}
                    </p>
                )}

                {entries.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">
                            {UI.noHistoryEntries}
                        </CardContent>
                    </Card>
                ) : (
                    <ul className="space-y-8">
                        {shownByDayThenExercise.map(({ date: dayKey, exercises }) => (
                            <HistoryDaySection
                                key={dayKey}
                                dayKey={dayKey}
                                exercises={exercises}
                                resolveExercise={resolveTrackedExercise}
                                isTrackedActive={(id) => !!getTrackedExerciseById(id)}
                                entryInsights={entryInsights}
                                onEditEntry={setEditEntry}
                                onDeleteEntry={handleDeleteEntry}
                            />
                        ))}
                    </ul>
                )}
            </main>

            {editEntry && editExercise && (
                <AddPerfDrawer
                    open={!!editEntry}
                    onOpenChange={(open) => !open && setEditEntry(null)}
                    exercise={{
                        id: editExercise.id,
                        name: editExercise.name,
                        originalName: editExercise.originalName,
                        equipment: editExercise.equipment,
                        target: editExercise.target,
                    }}
                    initialWeight={editEntry.weight}
                    initialReps={editEntry.reps}
                    entryId={editEntry.id}
                    onUpdate={(entryId, weight, reps) => {
                        updatePerformance(entryId, weight, reps)
                        reload()
                        setEditEntry(null)
                    }}
                />
            )}
        </div>
    )
}
