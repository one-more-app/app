import { AddPerfDrawer } from '@/components/AddPerfDrawer'
import { BackHeader } from '@/components/BackHeader'
import { HistoryDaySection } from '@/components/history/HistoryDaySection'
import { HistoryPageSkeleton } from '@/components/skeletons'
import { EmptyState } from '@/components/ui/empty-state'
import {
    usePerformanceDataRefresh,
    usePerformanceEntriesData,
    useTrackedExercisesData,
    useUserProfileData,
} from '@/hooks/use-api-data'
import {
    buildEntryInsights,
    groupByDayThenExercise,
    resolveTrackedExercise,
} from '@/lib/history-entries'
import { getExerciseImageUrl } from '@/lib/exercisedb'
import { computeLeagueFromPB, notifyPerfMilestones } from '@/lib/perf-notifications'
import { notifyXpGrants } from '@/lib/xp-notifications'
import {
    deletePerformanceAndWait,
    getPersonalBest,
    savePerformanceAndWait,
    updatePerformanceAndWait,
} from '@/lib/storage'
import { UI } from '@/lib/translations'
import type { PerformanceEntry } from '@/types'
import { HistoryIcon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

const MAX_SHOWN = 150

export function HistoryPage() {
    const { data: allEntries = [], isLoading: isLoadingEntries } = usePerformanceEntriesData()
    const refreshAfterPerfChange = usePerformanceDataRefresh()
    const { data: tracked = [] } = useTrackedExercisesData()
    const { data: profile } = useUserProfileData()
    const entries = useMemo(
        () =>
            allEntries
                .filter((entry) => !entry.deletedAt)
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                ),
        [allEntries],
    )
    const [editEntry, setEditEntry] = useState<PerformanceEntry | null>(null)
    const [addPerf, setAddPerf] = useState<{
        date: string
        trackedExerciseId: string
    } | null>(null)

    const shown = useMemo(() => entries.slice(0, MAX_SHOWN), [entries])
    const shownByDayThenExercise = useMemo(
        () => groupByDayThenExercise(shown),
        [shown],
    )
    const truncated = entries.length > MAX_SHOWN

    const entryInsights = useMemo(
        () =>
            buildEntryInsights(
                entries,
                profile ?? { weightKg: 75, heightCm: 175, gender: 'male' },
            ),
        [entries, profile],
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
                void (async () => {
                    await deletePerformanceAndWait(entry.id)
                    await refreshAfterPerfChange()
                })()
            }
        },
        [refreshAfterPerfChange],
    )

    return (
        <div className="min-h-screen-app bg-background">
            <BackHeader title={UI.history} />

            <main className="mx-auto max-w-2xl space-y-4 p-4 pb-2">
                {truncated && (
                    <p className="text-xs text-muted-foreground">
                        {UI.historyTruncated
                            .replace('{shown}', String(MAX_SHOWN))
                            .replace('{total}', String(entries.length))}
                    </p>
                )}

                {isLoadingEntries ? (
                    <HistoryPageSkeleton />
                ) : entries.length === 0 ? (
                    <EmptyState
                        icon={HistoryIcon}
                        title={UI.noHistoryEntriesTitle}
                        description={UI.noHistoryEntriesDescription}
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
                                isTrackedActive={(id) =>
                                    tracked.some((exercise) => exercise.id === id && !exercise.deletedAt)
                                }
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
                        void (async () => {
                            await updatePerformanceAndWait(entryId, weight, reps)
                            await refreshAfterPerfChange()
                            setEditEntry(null)
                        })()
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
                        const prevPB =
                            getPersonalBest(addPerf.trackedExerciseId) ?? null
                        const prevLeague = computeLeagueFromPB({
                            exercise: addExercise,
                            personalBest: prevPB,
                            profile,
                        })
                        void (async () => {
                            try {
                                const { xp } = await savePerformanceAndWait(
                                    addPerf.trackedExerciseId,
                                    weight,
                                    reps,
                                    { date: addPerf.date },
                                )
                                notifyXpGrants(xp)
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
                                    savedWeight: weight,
                                    savedReps: reps,
                                    prevLeague,
                                    nextLeague,
                                    exerciseImageUrl:
                                        getExerciseImageUrl(addExercise.gifUrl) ||
                                        undefined,
                                })
                            } finally {
                                void refreshAfterPerfChange()
                                setAddPerf(null)
                            }
                        })()
                    }}
                />
            ) : null}
        </div>
    )
}
