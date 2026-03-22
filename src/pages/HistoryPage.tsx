import { AddPerfDrawer } from '@/components/AddPerfDrawer'
import { BackHeader } from '@/components/BackHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LEAGUE_COLORS } from '@/lib/league-colors'
import {
    computeLeagueFromPB,
    isNewPersonalBest,
} from '@/lib/perf-notifications'
import { getExerciseImageUrl } from '@/lib/exercisedb'
import {
    deletePerformance,
    getAllPerformanceEntriesRecentFirst,
    getTrackedExerciseById,
    getTrackedExercisesForSync,
    getUserProfile,
    updatePerformance,
} from '@/lib/storage'
import { getLeagueLevelIndex, type LeagueInfo } from '@/lib/strength-standards'
import { UI } from '@/lib/translations'
import type { PerformanceEntry, TrackedExercise, UserProfile } from '@/types'
import { Dumbbell, Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const MAX_SHOWN = 150

function resolveTrackedExercise(trackedId: string): TrackedExercise | undefined {
    const active = getTrackedExerciseById(trackedId)
    if (active) return active
    return getTrackedExercisesForSync().find((e) => e.id === trackedId)
}

function formatPerfLabel(weight: number, reps: number): string {
    const weightLabel =
        weight === 0
            ? `${UI.bodyWeightAbbr} (${UI.bodyWeightOnly})`
            : `${weight} kg`
    return `${weightLabel} × ${reps} reps`
}

function formatDayHeading(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

function formatTimeOnly(createdAt: string): string {
    return new Date(createdAt).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

function groupEntriesByDayDesc(list: PerformanceEntry[]): { date: string; items: PerformanceEntry[] }[] {
    const map = new Map<string, PerformanceEntry[]>()
    for (const e of list) {
        const arr = map.get(e.date) ?? []
        arr.push(e)
        map.set(e.date, arr)
    }
    const days = [...map.keys()].sort((a, b) => b.localeCompare(a))
    return days.map((date) => ({ date, items: map.get(date)! }))
}

type Pb = { weight: number; reps: number } | null

function chronologicalPerfOrder(a: PerformanceEntry, b: PerformanceEntry): number {
    const byDate = a.date.localeCompare(b.date)
    if (byDate !== 0) return byDate
    const byCreated =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    if (byCreated !== 0) return byCreated
    return a.id.localeCompare(b.id)
}

function bestPbFromList(list: PerformanceEntry[]): Pb {
    if (list.length === 0) return null
    return list.reduce<Pb>(
        (best, e) =>
            !best ||
                e.weight > best.weight ||
                (e.weight === best.weight && e.reps > best.reps)
                ? { weight: e.weight, reps: e.reps }
                : best,
        null,
    )
}

function resolveTrackedForInsights(trackedId: string): TrackedExercise | undefined {
    const active = getTrackedExerciseById(trackedId)
    if (active) return active
    return getTrackedExercisesForSync().find((e) => e.id === trackedId)
}

/** Même logique que la liste « dernière session » sur la fiche exercice : record et palier vs perfs antérieures. */
function buildEntryInsights(
    allEntries: PerformanceEntry[],
    profile: UserProfile,
): Map<string, { isRecord: boolean; leagueUp: boolean; nextLeague: LeagueInfo | null }> {
    const byTracked = new Map<string, PerformanceEntry[]>()
    for (const e of allEntries) {
        const arr = byTracked.get(e.trackedExerciseId) ?? []
        arr.push(e)
        byTracked.set(e.trackedExerciseId, arr)
    }
    for (const arr of byTracked.values()) {
        arr.sort(chronologicalPerfOrder)
    }

    const out = new Map<
        string,
        { isRecord: boolean; leagueUp: boolean; nextLeague: LeagueInfo | null }
    >()

    for (const list of byTracked.values()) {
        for (let i = 0; i < list.length; i++) {
            const entry = list[i]
            const before = list.slice(0, i)
            const prevPB = bestPbFromList(before)
            const isRecord = isNewPersonalBest(prevPB, {
                weight: entry.weight,
                reps: entry.reps,
            })
            const newPB: Pb = !prevPB
                ? { weight: entry.weight, reps: entry.reps }
                : isRecord
                    ? { weight: entry.weight, reps: entry.reps }
                    : prevPB

            const exercise = resolveTrackedForInsights(entry.trackedExerciseId)
            if (!exercise) {
                out.set(entry.id, {
                    isRecord,
                    leagueUp: false,
                    nextLeague: null,
                })
                continue
            }

            const prevLeague = computeLeagueFromPB({
                exercise,
                personalBest: prevPB,
                profile,
            })
            const nextLeague = computeLeagueFromPB({
                exercise,
                personalBest: newPB,
                profile,
            })
            const leagueUp =
                !!nextLeague &&
                (!prevLeague ||
                    getLeagueLevelIndex(nextLeague.level) >
                    getLeagueLevelIndex(prevLeague.level))

            out.set(entry.id, { isRecord, leagueUp, nextLeague })
        }
    }
    return out
}

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

    const shown = useMemo(
        () => entries.slice(0, MAX_SHOWN),
        [entries],
    )
    const shownByDay = useMemo(() => groupEntriesByDayDesc(shown), [shown])
    const truncated = entries.length > MAX_SHOWN

    const profile = getUserProfile()
    const entryInsights = useMemo(
        () => buildEntryInsights(entries, profile),
        [entries, profile.weightKg, profile.heightCm, profile.gender],
    )

    const editExercise = editEntry
        ? resolveTrackedExercise(editEntry.trackedExerciseId)
        : undefined

    return (
        <div className="min-h-screen bg-background">
            <BackHeader title={UI.history} description={UI.historyGlobalSubtitle} />

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
                        {shownByDay.map(({ date: dayKey, items }) => (
                            <li key={dayKey} className="space-y-2">
                                <h2 className="text-sm font-semibold text-foreground">
                                    {formatDayHeading(dayKey)}
                                </h2>
                                <ul className="space-y-2">
                                    {items.map((entry) => {
                                        const ex = resolveTrackedExercise(entry.trackedExerciseId)
                                        const stillTracked = !!getTrackedExerciseById(entry.trackedExerciseId)
                                        const title = ex?.name ?? UI.exerciseNotFound
                                        const entryTime = formatTimeOnly(entry.createdAt)
                                        const insight = entryInsights.get(entry.id)

                                        const showGif =
                                            ex &&
                                            !ex.isCustom &&
                                            Boolean(ex.gifUrl?.trim())

                                        return (
                                            <li key={entry.id}>
                                                <Card className="py-0">
                                                    <CardContent className="flex items-start gap-3 p-3">
                                                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <Dumbbell className="size-6 text-accent" />
                                                            </div>
                                                            {showGif ? (
                                                                <img
                                                                    src={getExerciseImageUrl(ex.gifUrl)}
                                                                    alt=""
                                                                    className="relative z-10 size-12 object-cover"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.visibility =
                                                                            'hidden'
                                                                    }}
                                                                />
                                                            ) : null}
                                                        </div>
                                                        <div className="min-w-0 flex-1 space-y-0.5">
                                                            {stillTracked ? (
                                                                <Link
                                                                    to={`/exercise/${entry.trackedExerciseId}`}
                                                                    className="font-medium capitalize text-foreground underline-offset-4 hover:underline"
                                                                >
                                                                    {title}
                                                                </Link>
                                                            ) : (
                                                                <p className="font-medium capitalize text-muted-foreground">
                                                                    {title}
                                                                    {ex?.deletedAt ? (
                                                                        <span className="ml-1 text-xs font-normal normal-case">
                                                                            ({UI.exerciseRemovedFromTracking})
                                                                        </span>
                                                                    ) : null}
                                                                </p>
                                                            )}
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="text-sm font-medium">
                                                                    {formatPerfLabel(entry.weight, entry.reps)}
                                                                </p>
                                                                {insight?.isRecord ? (
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="text-xs shrink-0"
                                                                    >
                                                                        {UI.record}
                                                                    </Badge>
                                                                ) : null}
                                                                {insight?.leagueUp && insight.nextLeague ? (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`shrink-0 text-xs ${LEAGUE_COLORS[insight.nextLeague.level] ?? 'bg-muted'}`}
                                                                        title={UI.leaguePromotion}
                                                                    >
                                                                        {insight.nextLeague.label}
                                                                    </Badge>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                        <div className="flex shrink-0 flex-col items-end gap-1">
                                                            <div className="flex gap-0.5">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-9 w-9"
                                                                    disabled={!ex}
                                                                    onClick={() => ex && setEditEntry(entry)}
                                                                    aria-label={UI.modifyPerf}
                                                                >
                                                                    <Pencil className="size-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-9 w-9 text-destructive hover:text-destructive"
                                                                    onClick={() => {
                                                                        if (confirm(UI.confirmDeletePerf)) {
                                                                            deletePerformance(entry.id)
                                                                            reload()
                                                                        }
                                                                    }}
                                                                    aria-label={UI.deletePerf}
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </Button>
                                                            </div>
                                                            <time
                                                                className="text-xs tabular-nums text-muted-foreground"
                                                                dateTime={entry.createdAt}
                                                            >
                                                                {entryTime}
                                                            </time>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </li>
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
