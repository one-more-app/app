import {
    computeLeagueFromPB,
    isNewPersonalBest,
} from '@/lib/perf-notifications'
import {
    getTrackedExerciseById,
    getTrackedExercisesForSync,
} from '@/lib/storage'
import { getLeagueLevelIndex, type LeagueInfo } from '@/lib/strength-standards'
import { UI } from '@/lib/translations'
import type { PerformanceEntry, TrackedExercise, UserProfile } from '@/types'

export type HistoryEntryInsight = {
    isRecord: boolean
    leagueUp: boolean
    nextLeague: LeagueInfo | null
}

export function resolveTrackedExercise(
    trackedId: string,
): TrackedExercise | undefined {
    const active = getTrackedExerciseById(trackedId)
    if (active) return active
    return getTrackedExercisesForSync().find((e) => e.id === trackedId)
}

export function formatPerfLabel(weight: number, reps: number): string {
    const weightLabel =
        weight === 0
            ? `${UI.bodyWeightAbbr} (${UI.bodyWeightOnly})`
            : `${weight} kg`
    return `${weightLabel} × ${reps} reps`
}

export function formatTimeOnly(createdAt: string): string {
    return new Date(createdAt).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function formatDayHeading(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

function recentFirstOrder(a: PerformanceEntry, b: PerformanceEntry): number {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

/** Plus récent d’abord (même ordre que le détail historique par exercice). */
export function comparePerfEntriesRecentFirst(
    a: PerformanceEntry,
    b: PerformanceEntry,
): number {
    return recentFirstOrder(a, b)
}

/** Regroupe par exercice suivi ; ordre des groupes = dernière perf la plus récente ; entrées récentes d’abord dans chaque groupe. */
function groupEntriesByExerciseRecentFirst(
    list: PerformanceEntry[],
): { trackedExerciseId: string; items: PerformanceEntry[] }[] {
    const map = new Map<string, PerformanceEntry[]>()
    for (const e of list) {
        const arr = map.get(e.trackedExerciseId) ?? []
        arr.push(e)
        map.set(e.trackedExerciseId, arr)
    }
    const groups = [...map.entries()].map(([trackedExerciseId, items]) => {
        const sorted = [...items].sort(recentFirstOrder)
        const newestMs = new Date(sorted[0]!.createdAt).getTime()
        return { trackedExerciseId, items: sorted, newestMs }
    })
    groups.sort((a, b) => b.newestMs - a.newestMs)
    return groups.map(({ trackedExerciseId, items }) => ({ trackedExerciseId, items }))
}

/** Jours du plus récent au plus ancien ; dans chaque jour, groupes exercice (ordre = perf la plus récente ce jour-là). */
export function groupByDayThenExercise(
    list: PerformanceEntry[],
): { date: string; exercises: { trackedExerciseId: string; items: PerformanceEntry[] }[] }[] {
    const byDay = new Map<string, PerformanceEntry[]>()
    for (const e of list) {
        const arr = byDay.get(e.date) ?? []
        arr.push(e)
        byDay.set(e.date, arr)
    }
    const days = [...byDay.keys()].sort((a, b) => b.localeCompare(a))
    return days.map((date) => ({
        date,
        exercises: groupEntriesByExerciseRecentFirst(byDay.get(date)!),
    }))
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
export function buildEntryInsights(
    allEntries: PerformanceEntry[],
    profile: UserProfile,
): Map<string, HistoryEntryInsight> {
    const byTracked = new Map<string, PerformanceEntry[]>()
    for (const e of allEntries) {
        const arr = byTracked.get(e.trackedExerciseId) ?? []
        arr.push(e)
        byTracked.set(e.trackedExerciseId, arr)
    }
    for (const arr of byTracked.values()) {
        arr.sort(chronologicalPerfOrder)
    }

    const out = new Map<string, HistoryEntryInsight>()

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
