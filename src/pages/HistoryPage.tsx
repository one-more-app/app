import { AddPerfDrawer } from '@/components/AddPerfDrawer'
import { BackHeader } from '@/components/BackHeader'
import { HistoryDaySection } from '@/components/history/HistoryDaySection'
import { EmptyState } from '@/components/ui/empty-state'
import {
    buildEntryInsights,
    groupByDayThenExercise,
    resolveTrackedExercise,
} from '@/lib/history-entries'
import { computeLeagueFromPB, notifyPerfMilestones } from '@/lib/perf-notifications'
import {
    deletePerformance,
    getAllPerformanceEntriesRecentFirst,
    getPersonalBest,
    getTrackedExerciseById,
    getUserProfile,
    savePerformance,
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
    const [addPerf, setAddPerf] = useState<{
        date: string
        trackedExerciseId: string
    } | null>(null)

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

    const addExercise = addPerf
        ? resolveTrackedExercise(addPerf.trackedExerciseId)
        : undefined

    const addInitialWeightReps = useMemo(() => {
        if (!addPerf) return { weight: 20, reps: 8 }
        const sameDay = entries.filter(
            (e) =>
                e.date === addPerf.date &&
                e.trackedExerciseId === addPerf.trackedExerciseId,
        )
        const newestSameDay = sameDay.reduce<PerformanceEntry | undefined>(
            (best, e) =>
                !best ||
                new Date(e.createdAt).getTime() >
                    new Date(best.createdAt).getTime()
                    ? e
                    : best,
            undefined,
        )
        const latestAny = entries.find(
            (e) => e.trackedExerciseId === addPerf.trackedExerciseId,
        )
        return {
            weight: newestSameDay?.weight ?? latestAny?.weight ?? 20,
            reps: newestSameDay?.reps ?? latestAny?.reps ?? 8,
        }
    }, [addPerf, entries])

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
                    <EmptyState
                        description={UI.noHistoryEntries}
                        contentClassName="py-8 text-sm"
                    />
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
                                onAddEntry={(trackedExerciseId, dayKey) =>
                                    setAddPerf({ trackedExerciseId, date: dayKey })
                                }
                            />
                        ))}
                    </ul>
                )}
            </main>

            {editEntry && editExercise ? (
                <AddPerfDrawer
                    open
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
            ) : addPerf && addExercise ? (
                <AddPerfDrawer
                    open
                    onOpenChange={(open) => !open && setAddPerf(null)}
                    exercise={{
                        id: addExercise.id,
                        name: addExercise.name,
                        originalName: addExercise.originalName,
                        equipment: addExercise.equipment,
                        target: addExercise.target,
                    }}
                    initialWeight={addInitialWeightReps.weight}
                    initialReps={addInitialWeightReps.reps}
                    onSave={(weight, reps) => {
                        const profile = getUserProfile()
                        const prevPB =
                            getPersonalBest(addPerf.trackedExerciseId) ?? null
                        const prevLeague = computeLeagueFromPB({
                            exercise: addExercise,
                            personalBest: prevPB,
                            profile,
                        })
                        savePerformance(
                            addPerf.trackedExerciseId,
                            weight,
                            reps,
                            { date: addPerf.date },
                        )
                        reload()
                        const nextPB =
                            getPersonalBest(addPerf.trackedExerciseId) ?? null
                        const nextLeague = computeLeagueFromPB({
                            exercise: addExercise,
                            personalBest: nextPB,
                            profile,
                        })
                        notifyPerfMilestones({
                            exerciseName: addExercise.name,
                            prevPB,
                            nextPB,
                            prevLeague,
                            nextLeague,
                        })
                        setAddPerf(null)
                    }}
                />
            ) : null}
        </div>
    )
}
