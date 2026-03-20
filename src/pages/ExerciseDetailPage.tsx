import { BackHeader } from '@/components/BackHeader'
import { ExerciseCard } from '@/components/ExerciseCard'
import { LeagueBadge } from '@/components/LeagueBadge'
import { PerformanceChart } from '@/components/PerformanceChart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { usePerformance } from '@/hooks/use-performance'
import { LEAGUE_COLORS } from '@/lib/league-colors'
import {
    computeLeagueFromPB,
    isNewPersonalBest,
    notifyPerfMilestones,
} from '@/lib/perf-notifications'
import {
    getPersonalBest,
    getTrackedExerciseById,
    getUserProfile,
    removeTrackedExercise,
    updateTrackedExercise,
} from '@/lib/storage'
import {
    getAllTiers,
    getLeagueInfo,
    getLeagueLevelIndex,
    isDumbbellExercise,
} from '@/lib/strength-standards'
import { UI } from '@/lib/translations'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export function ExerciseDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [exercise, setExercise] = useState(() =>
        id ? getTrackedExerciseById(id) : null
    )
    const [renameOpen, setRenameOpen] = useState(false)
    const [renameValue, setRenameValue] = useState('')

    useEffect(() => {
        setExercise(id ? getTrackedExerciseById(id) : null)
    }, [id])
    const {
        entries,
        lastPerf,
        personalBest,
        savePerformance,
        deletePerformance,
        updatePerformance,
        refresh,
    } = usePerformance(id ?? null)
    const profile = getUserProfile()
    const leagueInfo =
        exercise && !exercise.isCustom && personalBest
            ? getLeagueInfo({
                weight: personalBest.weight,
                reps: personalBest.reps,
                bodyWeightKg: profile.weightKg,
                gender: profile.gender,
                exerciseName: exercise.originalName ?? exercise.name,
                exerciseMetadata: exercise.equipment && exercise.target
                    ? { equipment: exercise.equipment, target: exercise.target, bodyPart: exercise.bodyPart }
                    : undefined,
            })
            : null
    const allTiers =
        leagueInfo && exercise && !exercise.isCustom
            ? getAllTiers(
                profile.weightKg,
                profile.gender,
                exercise.originalName ?? exercise.name,
                exercise.equipment && exercise.target
                    ? { equipment: exercise.equipment, target: exercise.target, bodyPart: exercise.bodyPart }
                    : undefined
            )
            : null
    const [showAllTiers, setShowAllTiers] = useState(false)
    const [historySessionIndex, setHistorySessionIndex] = useState(0)

    useEffect(() => {
        setHistorySessionIndex(0)
    }, [id])

    if (!exercise) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">{UI.exerciseNotFound}</p>
                <Button onClick={() => navigate(-1)}>{UI.back}</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <BackHeader
                compact
                title={exercise.name}
                titleClassName="capitalize"
                right={
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setRenameValue(exercise.name)
                            setRenameOpen(true)
                        }}
                        aria-label={UI.rename}
                    >
                        <Pencil className="size-4" />
                    </Button>
                }
            />

            <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
                <ExerciseCard
                    exercise={exercise}
                    lastPerf={lastPerf ?? undefined}
                    personalBest={personalBest ?? undefined}
                    leagueInfo={leagueInfo}
                    imageSize="sm"
                    onSavePerf={(weight, reps) => {
                        const prevPB = personalBest ?? null
                        const prevLeague = leagueInfo ?? null
                        savePerformance(weight, reps)
                        const nextPB = id ? getPersonalBest(id) ?? null : null
                        const profile = getUserProfile()
                        const nextLeague =
                            exercise
                                ? computeLeagueFromPB({
                                    exercise,
                                    personalBest: nextPB,
                                    profile,
                                })
                                : null

                        notifyPerfMilestones({
                            exerciseName: exercise.name,
                            prevPB,
                            nextPB,
                            prevLeague,
                            nextLeague,
                        })
                        refresh()
                    }}
                />

                {leagueInfo && (
                    <Card className="gap-0">
                        <CardHeader className="gap-0">
                            <h2 className="font-semibold m-0 p-0">{UI.league}</h2>
                        </CardHeader>
                        <CardContent className="flex flex-col pb-1">
                            <LeagueBadge
                                league={leagueInfo}
                                showNextTarget
                                weightSuffix={
                                    exercise &&
                                        isDumbbellExercise(
                                            exercise.originalName ?? exercise.name,
                                            exercise.equipment && exercise.target
                                                ? { equipment: exercise.equipment, target: exercise.target }
                                                : undefined
                                        )
                                        ? ' kg (par haltère)'
                                        : ' kg'
                                }
                            />
                            {exercise &&
                                isDumbbellExercise(
                                    exercise.originalName ?? exercise.name,
                                    exercise.equipment && exercise.target
                                        ? { equipment: exercise.equipment, target: exercise.target }
                                        : undefined
                                ) && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {UI.dumbbellWeightHint}
                                    </p>
                                )}
                            {allTiers && allTiers.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full justify-between text-muted-foreground"
                                        onClick={() => setShowAllTiers((v) => !v)}
                                    >
                                        {UI.allTiers}
                                        {showAllTiers ? (
                                            <ChevronUp className="size-4" />
                                        ) : (
                                            <ChevronDown className="size-4" />
                                        )}
                                    </Button>
                                    {showAllTiers && (
                                        <ul className="mt-2 space-y-1.5">
                                            {allTiers.map((tier) => {
                                                const weightSuffix =
                                                    exercise &&
                                                        isDumbbellExercise(
                                                            exercise.originalName ?? exercise.name,
                                                            exercise.equipment && exercise.target
                                                                ? {
                                                                    equipment: exercise.equipment,
                                                                    target: exercise.target,
                                                                }
                                                                : undefined
                                                        )
                                                        ? ' kg (par haltère)'
                                                        : ' kg'
                                                return (
                                                    <li
                                                        key={tier.level}
                                                        className="flex items-center justify-between gap-2 text-sm"
                                                    >
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                LEAGUE_COLORS[tier.level] ?? 'bg-muted'
                                                            }
                                                        >
                                                            {tier.label}
                                                        </Badge>
                                                        <span className="text-muted-foreground">
                                                            {tier.weightMax != null
                                                                ? `${tier.weightMin.toFixed(1)} → ${tier.weightMax.toFixed(1)}${weightSuffix}`
                                                                : `≥ ${tier.weightMin.toFixed(1)}${weightSuffix}`}
                                                        </span>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {entries.length > 0 && (
                    <Card>
                        <CardHeader>
                            <h2 className="font-semibold">{UI.history} (poids)</h2>
                        </CardHeader>
                        <CardContent className='pb-0 pt-0'>
                            <PerformanceChart
                                className="p-0"
                                entries={entries}
                                exercise={{
                                    id: exercise.id,
                                    name: exercise.name,
                                    originalName: exercise.originalName,
                                    equipment: exercise.equipment,
                                    target: exercise.target,
                                }}
                                onDelete={deletePerformance}
                                onUpdate={updatePerformance}
                                onRefresh={refresh}
                            />
                            {(() => {
                                const byDate = entries.reduce<Record<string, typeof entries>>(
                                    (acc, e) => {
                                        (acc[e.date] ??= []).push(e)
                                        return acc
                                    },
                                    {}
                                )
                                const dates = Object.keys(byDate).sort(
                                    (a, b) => new Date(b).getTime() - new Date(a).getTime()
                                )
                                const safeIndex = Math.min(
                                    historySessionIndex,
                                    Math.max(0, dates.length - 1)
                                )
                                const lastDate = dates[safeIndex]
                                const lastSessionEntries = lastDate
                                    ? [...(byDate[lastDate] ?? [])].sort(
                                        (a, b) =>
                                            new Date(a.createdAt).getTime() -
                                            new Date(b.createdAt).getTime()
                                    )
                                    : []
                                if (lastSessionEntries.length === 0) return null
                                const formatDate = (d: string) =>
                                    new Date(d + 'T12:00:00').toLocaleDateString(undefined, {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })
                                const canGoNewer = safeIndex > 0
                                const canGoOlder = safeIndex < dates.length - 1
                                const entriesBeforeLastSession = entries.filter(
                                    (e) => e.date < lastDate
                                )
                                const bestBeforeSession =
                                    entriesBeforeLastSession.length === 0
                                        ? null
                                        : entriesBeforeLastSession.reduce((best, e) =>
                                            !best ||
                                                e.weight > best.weight ||
                                                (e.weight === best.weight && e.reps > best.reps)
                                                ? e
                                                : best
                                        )
                                return (
                                    <div className="border-t border-border pt-2">
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <h3 className="text-sm font-medium text-muted-foreground">
                                                {UI.lastSession} — {formatDate(lastDate)}
                                            </h3>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground"
                                                    disabled={!canGoOlder}
                                                    onClick={() =>
                                                        setHistorySessionIndex((i) =>
                                                            Math.min(dates.length - 1, i + 1)
                                                        )
                                                    }
                                                    aria-label={UI.nextSession}
                                                >
                                                    <ChevronLeft className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground"
                                                    disabled={!canGoNewer}
                                                    onClick={() =>
                                                        setHistorySessionIndex((i) => Math.max(0, i - 1))
                                                    }
                                                    aria-label={UI.previousSession}
                                                >
                                                    <ChevronRight className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <ul className="space-y-1.5">
                                            {lastSessionEntries.map((entry, i) => {
                                                const prevPB =
                                                    i === 0
                                                        ? bestBeforeSession
                                                            ? {
                                                                weight: bestBeforeSession.weight,
                                                                reps: bestBeforeSession.reps,
                                                            }
                                                            : null
                                                        : (() => {
                                                            const prevInSession = lastSessionEntries
                                                                .slice(0, i)
                                                                .reduce(
                                                                    (best, e) =>
                                                                        !best ||
                                                                            e.weight > best.weight ||
                                                                            (e.weight === best.weight &&
                                                                                e.reps > best.reps)
                                                                            ? e
                                                                            : best,
                                                                    null as {
                                                                        weight: number
                                                                        reps: number
                                                                    } | null
                                                                )
                                                            if (!prevInSession)
                                                                return bestBeforeSession
                                                                    ? {
                                                                        weight:
                                                                            bestBeforeSession.weight,
                                                                        reps: bestBeforeSession.reps,
                                                                    }
                                                                    : null
                                                            const fromBefore = bestBeforeSession
                                                                ? (bestBeforeSession.weight >
                                                                    prevInSession.weight ||
                                                                    (bestBeforeSession.weight ===
                                                                        prevInSession.weight &&
                                                                        bestBeforeSession.reps >
                                                                        prevInSession.reps)
                                                                    ? {
                                                                        weight: bestBeforeSession.weight,
                                                                        reps: bestBeforeSession.reps,
                                                                    }
                                                                    : {
                                                                        weight: prevInSession.weight,
                                                                        reps: prevInSession.reps,
                                                                    }
                                                                )
                                                                : {
                                                                    weight: prevInSession.weight,
                                                                    reps: prevInSession.reps,
                                                                }
                                                            return fromBefore
                                                        })()
                                                const isRecord = isNewPersonalBest(prevPB, {
                                                    weight: entry.weight,
                                                    reps: entry.reps,
                                                })
                                                const newPB = !prevPB
                                                    ? { weight: entry.weight, reps: entry.reps }
                                                    : isRecord
                                                        ? { weight: entry.weight, reps: entry.reps }
                                                        : prevPB
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
                                                    nextLeague &&
                                                    (!prevLeague ||
                                                        getLeagueLevelIndex(nextLeague.level) >
                                                        getLeagueLevelIndex(prevLeague.level))
                                                return (
                                                    <li
                                                        key={entry.id}
                                                        className="flex items-center justify-between gap-2 text-sm py-1.5 px-3 rounded-md bg-muted/50"
                                                    >
                                                        <span className="font-medium">
                                                            {entry.weight} kg × {entry.reps} reps
                                                        </span>
                                                        <div className="flex items-center gap-2 flex-wrap justify-end">
                                                            {isRecord && (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="text-xs shrink-0"
                                                                >
                                                                    {UI.record}
                                                                </Badge>
                                                            )}
                                                            {leagueUp && nextLeague && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`shrink-0 text-xs ${LEAGUE_COLORS[nextLeague.level] ?? 'bg-muted'}`}
                                                                    title={UI.leaguePromotion}
                                                                >
                                                                    {nextLeague.label}
                                                                </Badge>
                                                            )}
                                                            <span className="text-muted-foreground">
                                                                Série {i + 1}
                                                            </span>
                                                        </div>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    </div>
                                )
                            })()}
                        </CardContent>
                    </Card>
                )}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <h2 className="font-semibold">{UI.options}</h2>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                if (id && confirm(UI.confirmDelete)) {
                                    removeTrackedExercise(id)
                                    navigate('/home')
                                }
                            }}
                        >
                            <Trash2 className="mr-1 size-4" />
                            {UI.delete}
                        </Button>
                    </CardHeader>
                </Card>

                <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{UI.renameExercise}</DialogTitle>
                        </DialogHeader>
                        <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            placeholder={UI.placeholderExerciseName}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    if (id && renameValue.trim()) {
                                        updateTrackedExercise(id, {
                                            name: renameValue.trim(),
                                        })
                                        setExercise((prev) =>
                                            prev
                                                ? {
                                                    ...prev,
                                                    name: renameValue.trim(),
                                                }
                                                : null
                                        )
                                        setRenameOpen(false)
                                    }
                                }
                            }}
                        />
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                variant="outline"
                                onClick={() => setRenameOpen(false)}
                            >
                                {UI.cancel}
                            </Button>
                            <Button
                                onClick={() => {
                                    if (id && renameValue.trim()) {
                                        updateTrackedExercise(id, {
                                            name: renameValue.trim(),
                                        })
                                        setExercise((prev) =>
                                            prev
                                                ? {
                                                    ...prev,
                                                    name: renameValue.trim(),
                                                }
                                                : null
                                        )
                                        setRenameOpen(false)
                                    }
                                }}
                                disabled={!renameValue.trim()}
                            >
                                {UI.save}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </main>
        </div>
    )
}
