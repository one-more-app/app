import { chronologicalPerfOrder } from '@/lib/performance-order'
import type { HistoryEntryLeagueInsight } from '@/lib/league-types'
import { getRankIndex, type LeagueInfo } from '@/lib/strength-standards'
import { UI } from '@/lib/translations'
import type { PerformanceEntry, PerformanceEntryWithLeagueInsight, TrackedExercise } from '@/types'
import {
    getTrackedExerciseById,
    getAllTrackedExercises,
} from '@/lib/storage'

export type HistoryEntryInsight = HistoryEntryLeagueInsight

export type ExerciseGroupInsightSummary = {
    hasNewRecord: boolean
    leaguePromotion: {
        prevLeague: LeagueInfo | null
        nextLeague: LeagueInfo
    } | null
}

export function entryInsightsFromPerformances(
    entries: PerformanceEntryWithLeagueInsight[],
): Map<string, HistoryEntryInsight> {
    const out = new Map<string, HistoryEntryInsight>()
    for (const e of entries) {
        if ('leagueInsight' in e) {
            out.set(e.id, e.leagueInsight)
        }
    }
    return out
}

export function summarizeExerciseGroupInsights(
    items: PerformanceEntry[],
    entryInsights: Map<string, HistoryEntryInsight>,
): ExerciseGroupInsightSummary {
    let hasNewRecord = false
    let leaguePromotion: ExerciseGroupInsightSummary['leaguePromotion'] = null
    let bestNextIndex = -1

    for (const item of items) {
        const insight = entryInsights.get(item.id)
        if (!insight) continue
        if (insight.isRecord) hasNewRecord = true
        if (insight.leagueUp && insight.nextLeague) {
            const nextIndex = getRankIndex(insight.nextLeague.rankId)
            if (nextIndex > bestNextIndex) {
                bestNextIndex = nextIndex
                leaguePromotion = {
                    prevLeague: insight.prevLeague,
                    nextLeague: insight.nextLeague,
                }
            }
        }
    }

    return { hasNewRecord, leaguePromotion }
}

export function resolveTrackedExercise(
    trackedId: string,
): TrackedExercise | undefined {
    const active = getTrackedExerciseById(trackedId)
    if (active) return active
    return getAllTrackedExercises().find((e) => e.id === trackedId)
}

export function formatPerfLabel(weight: number, reps: number): string {
    const weightLabel =
        weight === 0
            ? `${UI.bodyWeightAbbr} (${UI.bodyWeightOnly})`
            : `${weight} kg`
    return `${weightLabel} × ${reps}`
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

export function comparePerfEntriesRecentFirst(
    a: PerformanceEntry,
    b: PerformanceEntry,
): number {
    return recentFirstOrder(a, b)
}

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

export { chronologicalPerfOrder }
