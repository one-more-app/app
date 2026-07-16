import { AddPerfDrawer } from '@/components/AddPerfDrawer'
import { BackHeader } from '@/components/BackHeader'
import { CustomExerciseMetadataFields } from '@/components/CustomExerciseMetadataFields'
import { ExerciseCard } from '@/components/ExerciseCard'
import { PerfEntryList } from '@/components/history/PerfEntryList'
import { LeagueBadge } from '@/components/LeagueBadge'
import { PerformanceChart } from '@/components/PerformanceChart'
import { RankBadge } from '@/components/RankBadge'
import { RestSinceLastSetBar } from '@/components/RestSinceLastSetBar'
import { ExerciseDetailPageSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import {
    useHomeExercisesData,
    usePerformanceDataRefresh,
    useTrackedDataRefresh,
} from '@/hooks/use-api-data'
import { useCelebrationQueueActive } from '@/hooks/use-celebration-queue-active'
import { useExercisePresence } from '@/hooks/use-exercise-presence'
import { useLatestGlobalPerf } from '@/hooks/use-latest-global-perf'
import { usePerformance } from '@/hooks/use-performance'
import { useTheme } from '@/hooks/use-theme'
import { fetchExercisesMeta, fetchExerciseTierLadder, fetchPerformanceEntries } from '@/lib/data-api'
import { getExerciseImageUrl } from '@/lib/exercisedb'
import {
    comparePerfEntriesRecentFirst,
    entryInsightsFromPerformances,
    formatDayHeading,
} from '@/lib/history-entries'
import { inferBodyPartFromTarget } from '@/lib/infer-body-part-from-target'
import { getJoyrideScrollOffset } from '@/lib/joyride-config'
import { notifyPerfMilestones } from '@/lib/perf-notifications'
import {
    getPersonalBest,
    getTrackedExerciseById,
    isOnboardingFirstExercisePending,
    isOnboardingTourComplete,
    removeTrackedExerciseAndWait,
    setOnboardingFirstExercisePending,
    setOnboardingTourComplete,
    updateTrackedExerciseAndWait,
} from '@/lib/storage'
import { isDumbbellExercise } from '@/lib/strength-standards'
import { UI } from '@/lib/translations'
import { finalizeDeferredGymOnboarding } from '@/lib/gym-onboarding'
import { notifyXpGrants } from '@/lib/xp-notifications'
import type { PerformanceEntry } from '@/types'
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Pencil,
    SearchX,
    Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EVENTS, Joyride, type EventData, type Step } from 'react-joyride'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import useSWR from 'swr'

type ExerciseDetailLocationState = {
    fromAddExercise?: boolean
}

export function ExerciseDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const fromAddExercise =
        (location.state as ExerciseDetailLocationState | null)?.fromAddExercise ===
        true
    /** Survit au replace de setSearchParams après le tour (sinon le retour ne fait rien). */
    const arrivedFromAddExerciseRef = useRef(
        fromAddExercise || isOnboardingFirstExercisePending(),
    )
    useEffect(() => {
        if (fromAddExercise || isOnboardingFirstExercisePending()) {
            arrivedFromAddExerciseRef.current = true
        }
    }, [fromAddExercise])
    const { resolvedTheme } = useTheme()
    const { data: homeExercises = [], isLoading: isLoadingTracked } = useHomeExercisesData()
    const refreshAfterTrackedChange = useTrackedDataRefresh()
    const refreshAfterPerfChange = usePerformanceDataRefresh()
    const exercise = useMemo(
        () =>
            id
                ? homeExercises.find((item) => item.id === id && !item.deletedAt) ??
                getTrackedExerciseById(id) ??
                null
                : null,
        [id, homeExercises],
    )
    const [renameOpen, setRenameOpen] = useState(false)
    const [renameValue, setRenameValue] = useState('')
    const [classificationTarget, setClassificationTarget] = useState('')
    const [classificationEquipment, setClassificationEquipment] = useState('')
    const { data: exerciseMeta } = useSWR('exercise-meta', fetchExercisesMeta)
    const classificationTargets = useMemo(
        () => exerciseMeta?.targets.filter((t) => t !== 'cardio') ?? [],
        [exerciseMeta],
    )
    const classificationEquipmentOptions = exerciseMeta?.equipment ?? []
    const {
        entries,
        lastPerf,
        personalBest,
        savePerformance,
        deletePerformance,
        updatePerformance,
        refresh,
    } = usePerformance(id ?? null)
    const latestGlobalPerf = useLatestGlobalPerf()
    const leagueInfo =
        exercise && 'league' in exercise ? exercise.league ?? null : null
    const { data: allTiers } = useSWR(
        id && exercise && !exercise.isCustom ? ['exercise-tiers', id] : null,
        () => fetchExerciseTierLadder(id!),
    )
    const { data: insightEntries } = useSWR(
        id ? ['perf-insights', id] : null,
        () =>
            fetchPerformanceEntries({
                trackedExerciseId: id!,
                withLeagueInsights: true,
            }),
    )
    const [showAllTiers, setShowAllTiers] = useState(false)
    const [historySessionIndex, setHistorySessionIndex] = useState(0)

    useEffect(() => {
        setHistorySessionIndex(0)
    }, [id])

    useEffect(() => {
        if (!exercise?.isCustom) return
        setClassificationTarget(exercise.target ?? classificationTargets[0] ?? '')
        setClassificationEquipment(
            exercise.equipment ??
            (classificationEquipmentOptions.includes('body weight')
                ? 'body weight'
                : classificationEquipmentOptions[0] ?? ''),
        )
    }, [
        exercise?.id,
        exercise?.isCustom,
        exercise?.target,
        exercise?.equipment,
        classificationTargets,
        classificationEquipmentOptions,
    ])

    const canSaveRenameEdits =
        renameValue.trim().length > 0 &&
        (!exercise?.isCustom ||
            (!!classificationTarget && !!classificationEquipment))

    const saveRenameEdits = useCallback(async () => {
        if (!id || !renameValue.trim()) return
        if (
            exercise?.isCustom &&
            (!classificationTarget || !classificationEquipment)
        ) {
            return
        }
        const payload: Parameters<typeof updateTrackedExerciseAndWait>[1] = {
            name: renameValue.trim(),
        }
        if (
            exercise?.isCustom &&
            classificationTarget &&
            classificationEquipment
        ) {
            payload.bodyPart = inferBodyPartFromTarget(classificationTarget)
            payload.target = classificationTarget
            payload.equipment = classificationEquipment
        }
        await updateTrackedExerciseAndWait(id, payload)
        await refreshAfterTrackedChange()
        setRenameOpen(false)
    }, [
        id,
        renameValue,
        exercise?.isCustom,
        classificationTarget,
        classificationEquipment,
        refreshAfterTrackedChange,
    ])

    const onboardingFirstExercisePending = isOnboardingFirstExercisePending()
    const onboardingTourActive =
        onboardingFirstExercisePending && !isOnboardingTourComplete()
    const celebrationBlocking = useCelebrationQueueActive()
    const tourReady = onboardingTourActive && !celebrationBlocking

    const finishOnboardingTour = useCallback(() => {
        setOnboardingTourComplete(true)
        if (onboardingFirstExercisePending) {
            setOnboardingFirstExercisePending(false)
            void finalizeDeferredGymOnboarding()
        }
    }, [onboardingFirstExercisePending])

    const handleJoyrideEvent = useCallback(
        (data: EventData) => {
            if (data.type === EVENTS.TOUR_END) {
                finishOnboardingTour()
            }
        },
        [finishOnboardingTour],
    )

    const [sessionDrawer, setSessionDrawer] = useState<
        | { mode: 'closed' }
        | { mode: 'edit'; entry: PerformanceEntry }
        | { mode: 'add'; date: string }
    >({ mode: 'closed' })

    useExercisePresence(
        Boolean(exercise),
        exercise?.name,
        id ?? undefined,
    )

    useEffect(() => {
        setSessionDrawer({ mode: 'closed' })
    }, [id])

    const entryInsights = useMemo(
        () =>
            insightEntries
                ? entryInsightsFromPerformances(insightEntries)
                : new Map(),
        [insightEntries],
    )

    const viewedSession = useMemo(() => {
        if (entries.length === 0) return null
        const byDate = entries.reduce<Record<string, PerformanceEntry[]>>((acc, e) => {
            (acc[e.date] ??= []).push(e)
            return acc
        }, {})
        const dates = Object.keys(byDate).sort(
            (a, b) => new Date(b).getTime() - new Date(a).getTime(),
        )
        const safeIndex = Math.min(
            historySessionIndex,
            Math.max(0, dates.length - 1),
        )
        const lastDate = dates[safeIndex]!
        const sessionRaw = byDate[lastDate] ?? []
        if (sessionRaw.length === 0) return null
        const sortedForList = [...sessionRaw].sort(comparePerfEntriesRecentFirst)
        return {
            lastDate,
            sortedForList,
            dates,
            canGoNewer: safeIndex > 0,
            canGoOlder: safeIndex < dates.length - 1,
        }
    }, [entries, historySessionIndex])

    const exerciseOnboardingSteps = useMemo<Step[]>(() => {
        const scrollOffset = getJoyrideScrollOffset()
        const steps: Step[] = [
            {
                target: '[data-tour="exercise-overview"]',
                title: UI.exerciseOnboardingTourOverviewTitle,
                content: UI.exerciseOnboardingTourOverviewContent,
                placement: 'bottom',
                skipScroll: true,
            },
        ]
        if (leagueInfo) {
            steps.push({
                target: '[data-tour="exercise-league"]',
                title: UI.exerciseOnboardingTourLeagueTitle,
                content: UI.exerciseOnboardingTourLeagueContent,
                placement: 'bottom',
                scrollOffset,
            })
        }
        if (entries.length > 0) {
            steps.push({
                target: '[data-tour="exercise-history"]',
                title: UI.exerciseOnboardingTourHistoryTitle,
                content: UI.exerciseOnboardingTourHistoryContent,
                placement: 'top',
                scrollOffset,
            })
        }
        return steps
    }, [entries.length, leagueInfo, tourReady])

    const exerciseJoyrideOptions = useMemo(
        () => ({
            arrowColor: 'var(--card)',
            backgroundColor: 'var(--card)',
            textColor: 'var(--card-foreground)',
            primaryColor: 'var(--accent)',
            overlayColor:
                resolvedTheme === 'dark'
                    ? 'oklch(0.04 0 0 / 0.82)'
                    : 'oklch(0.2 0 0 / 0.5)',
            spotlightPadding: 10,
            spotlightRadius: 14,
            zIndex: 120,
            showProgress: true,
            skipBeacon: true,
            scrollOffset: getJoyrideScrollOffset(),
            buttons: ['back', 'close', 'primary', 'skip'] as const,
        }),
        [resolvedTheme, tourReady],
    )

    const exerciseJoyrideStyles = useMemo(
        () => ({
            tooltip: {
                backgroundColor: 'var(--card)',
                color: 'var(--card-foreground)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border)',
                boxShadow:
                    resolvedTheme === 'dark'
                        ? '0 16px 48px oklch(0 0 0 / 0.55), 0 0 0 1px oklch(1 0 0 / 0.06)'
                        : '0 16px 40px oklch(0 0 0 / 0.14), 0 0 0 1px oklch(0 0 0 / 0.05)',
                fontFamily: 'var(--font-sans)',
                padding: '1rem 1rem 0.75rem',
            },
            tooltipContainer: {
                textAlign: 'left' as const,
            },
            tooltipTitle: {
                fontFamily: 'var(--font-one-more)',
                fontStyle: 'italic',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.04em',
                fontSize: '0.9375rem',
                color: 'var(--card-foreground)',
                marginBottom: '0.35rem',
            },
            tooltipContent: {
                color: 'var(--muted-foreground)',
                fontSize: '0.875rem',
                lineHeight: 1.55,
                padding: '0.25rem 0 0',
            },
            tooltipFooter: {
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border)',
                gap: '0.5rem',
            },
            buttonPrimary: {
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-foreground)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-one-more)',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.06em',
                padding: '0.5rem 1rem',
                outline: 'none',
            },
            buttonBack: {
                color: 'var(--muted-foreground)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                padding: '0.5rem 0.75rem',
                marginRight: 'auto',
            },
            buttonSkip: {
                color: 'var(--muted-foreground)',
                fontSize: '0.8125rem',
                padding: '0.5rem 0.5rem',
            },
            buttonClose: {
                color: 'var(--muted-foreground)',
                height: '0.75rem',
                width: '0.75rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
            },
        }),
        [resolvedTheme],
    )

    const handleBack = useCallback(() => {
        if (arrivedFromAddExerciseRef.current) {
            navigate('/home', { replace: true })
            return
        }
        navigate(-1)
    }, [navigate])

    if (id && isLoadingTracked && !exercise) {
        return (
            <div className="min-h-screen-app bg-background">
                <BackHeader compact title="" />
                <main className="mx-auto max-w-2xl px-4 py-4">
                    <ExerciseDetailPageSkeleton />
                </main>
            </div>
        )
    }

    if (!exercise) {
        return (
            <div className="flex min-h-screen-app flex-col items-center justify-center px-4">
                <EmptyState
                    variant="plain"
                    icon={SearchX}
                    iconClassName="text-muted-foreground"
                    description={UI.exerciseNotFound}
                >
                    <Button onClick={handleBack}>{UI.back}</Button>
                </EmptyState>
            </div>
        )
    }

    return (
        <div className="min-h-screen-app bg-background">
            <div
                data-sticky-app-header
                className="sticky-top-safe z-100 bg-card border-b border-border"
            >
                <BackHeader
                    embedded
                    compact
                    title={exercise.name}
                    onBack={handleBack}
                    right={
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setRenameValue(exercise.name)
                                if (exercise.isCustom) {
                                    setClassificationTarget(
                                        exercise.target ?? classificationTargets[0] ?? '',
                                    )
                                    setClassificationEquipment(
                                        exercise.equipment ??
                                        (classificationEquipmentOptions.includes(
                                            'body weight',
                                        )
                                            ? 'body weight'
                                            : classificationEquipmentOptions[0] ?? ''),
                                    )
                                }
                                setRenameOpen(true)
                            }}
                            aria-label={UI.rename}
                        >
                            <Pencil className="size-4" />
                        </Button>
                    }
                />
                <RestSinceLastSetBar
                    key={latestGlobalPerf?.entry.createdAt ?? 'none'}
                    createdAt={latestGlobalPerf?.entry.createdAt ?? null}
                    sourceExercise={latestGlobalPerf?.exercise ?? null}
                    currentExerciseId={id ?? null}
                />
            </div>

            <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
                <div data-tour="exercise-overview">
                    <ExerciseCard
                        exercise={exercise}
                        lastPerf={lastPerf ?? undefined}
                        personalBest={personalBest ?? undefined}
                        leagueInfo={leagueInfo}
                        imageSize="sm"
                        onSavePerf={(weight, reps) => {
                            const prevPB = personalBest ?? null
                            void (async () => {
                                try {
                                    const result = await savePerformance(
                                        weight,
                                        reps,
                                    )
                                    notifyXpGrants(result?.xp)
                                    const nextPB = id ? getPersonalBest(id) ?? null : null
                                    notifyPerfMilestones({
                                        exerciseName: exercise.name,
                                        prevPB,
                                        nextPB,
                                        savedWeight: weight,
                                        savedReps: reps,
                                        league: result?.xp?.league,
                                        exerciseImageUrl:
                                            getExerciseImageUrl(exercise.gifUrl) ||
                                            undefined,
                                        bodyPart: exercise.bodyPart,
                                        target: exercise.target,
                                    })
                                } finally {
                                    refresh()
                                    void refreshAfterPerfChange()
                                }
                            })()
                        }}
                    />
                </div>

                {leagueInfo && (
                    <Card className="gap-0" data-tour="exercise-league">
                        <CardHeader className="gap-0">
                            <CardTitle>{UI.league}</CardTitle>
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
                                                        key={tier.rankId}
                                                        className="flex items-center justify-between gap-2 text-sm"
                                                    >
                                                        <RankBadge
                                                            rankId={tier.rankId}
                                                            size="sm"
                                                        />
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
                    <Card data-tour="exercise-history">
                        <CardHeader>
                            <CardTitle>{UI.history} (poids)</CardTitle>
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
                            {viewedSession ? (
                                <div className="border-t border-border pt-2">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <h3 className="text-sm font-medium text-muted-foreground">
                                            {formatDayHeading(viewedSession.lastDate)}
                                        </h3>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground"
                                                disabled={!viewedSession.canGoOlder}
                                                onClick={() =>
                                                    setHistorySessionIndex((i) =>
                                                        Math.min(viewedSession.dates.length - 1, i + 1),
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
                                                disabled={!viewedSession.canGoNewer}
                                                onClick={() =>
                                                    setHistorySessionIndex((i) => Math.max(0, i - 1))
                                                }
                                                aria-label={UI.previousSession}
                                            >
                                                <ChevronRight className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <PerfEntryList
                                        listClassName="pb-0 pt-0 border-0"
                                        entries={viewedSession.sortedForList}
                                        entryInsights={entryInsights}
                                        canEdit
                                        onEditEntry={(entry) =>
                                            setSessionDrawer({ mode: 'edit', entry })
                                        }
                                        onDeleteEntry={(entry) => {
                                            if (confirm(UI.confirmDeletePerf)) {
                                                deletePerformance(entry.id)
                                                refresh()
                                            }
                                        }}
                                        onAddSet={() =>
                                            setSessionDrawer({
                                                mode: 'add',
                                                date: viewedSession.lastDate,
                                            })
                                        }
                                    />
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                )}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{UI.options}</CardTitle>
                        <Button
                            variant="outline-destructive"
                            size="sm"
                            onClick={() => {
                                if (id && confirm(UI.confirmDelete)) {
                                    void (async () => {
                                        await removeTrackedExerciseAndWait(id)
                                        await refreshAfterTrackedChange()
                                        navigate('/home')
                                    })()
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
                            <DialogTitle>
                                {exercise.isCustom
                                    ? UI.editCustomExercise
                                    : UI.renameExercise}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <Input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                placeholder={UI.placeholderExerciseName}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        if (canSaveRenameEdits) {
                                            void saveRenameEdits()
                                        }
                                    }
                                }}
                            />
                            {exercise.isCustom &&
                                classificationTargets.length > 0 &&
                                classificationEquipmentOptions.length > 0 ? (
                                <CustomExerciseMetadataFields
                                    targets={classificationTargets}
                                    equipmentOptions={classificationEquipmentOptions}
                                    target={classificationTarget}
                                    equipment={classificationEquipment}
                                    onTargetChange={setClassificationTarget}
                                    onEquipmentChange={setClassificationEquipment}
                                />
                            ) : null}
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                variant="outline"
                                onClick={() => setRenameOpen(false)}
                            >
                                {UI.cancel}
                            </Button>
                            <Button
                                onClick={() => void saveRenameEdits()}
                                disabled={!canSaveRenameEdits}
                            >
                                {UI.save}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {tourReady ? (
                    <Joyride
                        key={id}
                        steps={exerciseOnboardingSteps}
                        run={tourReady}
                        continuous
                        options={exerciseJoyrideOptions}
                        styles={exerciseJoyrideStyles}
                        locale={{
                            back: UI.back,
                            close: UI.joyrideClose,
                            last: UI.joyrideLast,
                            next: UI.next,
                            skip: UI.joyrideSkip,
                            nextWithProgress: UI.joyrideNextWithProgress,
                        }}
                        onEvent={handleJoyrideEvent}
                    />
                ) : null}

                <AddPerfDrawer
                    open={sessionDrawer.mode !== 'closed'}
                    onOpenChange={(open) => {
                        if (!open) setSessionDrawer({ mode: 'closed' })
                    }}
                    exercise={{
                        id: exercise.id,
                        name: exercise.name,
                        originalName: exercise.originalName,
                        equipment: exercise.equipment,
                        target: exercise.target,
                    }}
                    initialWeight={
                        sessionDrawer.mode === 'edit'
                            ? sessionDrawer.entry.weight
                            : sessionDrawer.mode === 'add'
                                ? ((viewedSession?.lastDate === sessionDrawer.date
                                    ? viewedSession.sortedForList[0]?.weight
                                    : undefined) ??
                                    lastPerf?.weight ??
                                    20)
                                : 20
                    }
                    initialReps={
                        sessionDrawer.mode === 'edit'
                            ? sessionDrawer.entry.reps
                            : sessionDrawer.mode === 'add'
                                ? ((viewedSession?.lastDate === sessionDrawer.date
                                    ? viewedSession.sortedForList[0]?.reps
                                    : undefined) ??
                                    lastPerf?.reps ??
                                    8)
                                : 8
                    }
                    entryId={
                        sessionDrawer.mode === 'edit'
                            ? sessionDrawer.entry.id
                            : undefined
                    }
                    onUpdate={
                        sessionDrawer.mode === 'edit'
                            ? (entryId, weight, reps) => {
                                updatePerformance(entryId, weight, reps)
                                refresh()
                            }
                            : undefined
                    }
                    onSave={
                        sessionDrawer.mode === 'add'
                            ? (weight, reps) => {
                                const prevPB = personalBest ?? null
                                void (async () => {
                                    try {
                                        const result = await savePerformance(
                                            weight,
                                            reps,
                                            { date: sessionDrawer.date },
                                        )
                                        notifyXpGrants(result?.xp)
                                        const nextPB = id ? getPersonalBest(id) ?? null : null
                                        notifyPerfMilestones({
                                            exerciseName: exercise.name,
                                            prevPB,
                                            nextPB,
                                            savedWeight: weight,
                                            savedReps: reps,
                                            league: result?.xp?.league,
                                            exerciseImageUrl:
                                                getExerciseImageUrl(
                                                    exercise.gifUrl,
                                                ) || undefined,
                                            bodyPart: exercise.bodyPart,
                                            target: exercise.target,
                                        })
                                    } finally {
                                        refresh()
                                        void refreshAfterPerfChange()
                                    }
                                })()
                            }
                            : undefined
                    }
                />

            </main>
        </div>
    )
}
