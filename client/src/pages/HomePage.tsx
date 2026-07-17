import { BrowsePageTitle, BrowseSectionTitle } from '@/components/exercise-browse-ui'
import { ExerciseBrowseNavigator } from '@/components/ExerciseBrowseNavigator'
import { ExerciseCard } from '@/components/ExerciseCard'
import { HomeTour } from '@/components/HomeTour'
import { SessionTimingLabel } from '@/components/session/SessionTimingLabel'
import { ExerciseCardSkeletonList } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { UserProgressBanner } from '@/components/UserProgressBanner'
import { useAccess } from '@/hooks/use-access'
import {
    useLeagueBrowseLookupsData,
    usePerformanceDataRefresh,
    usePerformanceEntriesData, useUserProgressData
} from '@/hooks/use-api-data'
import { useAuth } from '@/hooks/use-auth'
import { useExerciseCatalogBrowse } from '@/hooks/use-exercise-catalog-browse'
import { useExerciseFilters } from '@/hooks/use-exercise-filters'
import { useHomeData, type ExerciseWithPerf } from '@/hooks/use-home-data'
import { useReferralDrawer } from '@/hooks/use-referral-drawer'
import { readStoredSession } from '@/lib/auth'
import {
    sortBrowseableByLatestPerf,
    trackedToBrowseable,
} from '@/lib/exercise-catalog-browse'
import { CARDIO_EQUIPMENT, getExerciseImageUrl } from '@/lib/exercisedb'
import { filterExercisesDoneToday } from '@/lib/home-today-exercises'
import { getLocalDateKey, isPerformanceOnLocalDay } from '@/lib/local-date'
import { browseLookupsToMaps } from '@/lib/muscle-league-stats'
import { notifyPerfMilestones } from '@/lib/perf-notifications'
import {
    getLatestPerformanceCreatedAt,
    getPersonalBest,
    savePerformanceAndWait,
} from '@/lib/storage'
import { UI } from '@/lib/translations'
import { notifyXpGrants } from '@/lib/xp-notifications'
import { ChevronRight, Dumbbell, Plus, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function HomePage() {
    const auth = useAuth()
    const { exercises, hasLoaded } = useHomeData()
    const { data: progress } = useUserProgressData()
    const { data: performanceEntries = [] } = usePerformanceEntriesData()
    const refreshAfterPerfChange = usePerformanceDataRefresh()
    const { data: browseLookupsRaw } = useLeagueBrowseLookupsData()
    const { canAddExercise } = useAccess()
    const navigate = useNavigate()
    const { openReferralDrawer } = useReferralDrawer()
    const location = useLocation()

    const ownerUserId = useMemo(() => {
        if (auth.status === 'authenticated' && auth.user?.id) return auth.user.id
        return readStoredSession()?.user.id
    }, [auth.status, auth.user?.id])

    const todayKey = getLocalDateKey()

    const todayEntries = useMemo(
        () =>
            performanceEntries.filter(
                (entry) => !entry.deletedAt && isPerformanceOnLocalDay(entry, todayKey),
            ),
        [performanceEntries, todayKey],
    )

    const addExerciseLinkSearch = useMemo(() => {
        const q = new URLSearchParams(location.search).get('q')
        return q ? `?q=${encodeURIComponent(q)}` : ''
    }, [location.search])

    const goToAddExercise = useCallback(() => {
        if (!canAddExercise) {
            openReferralDrawer('limit')
            return
        }
        navigate(`/exercises${addExerciseLinkSearch}`)
    }, [canAddExercise, navigate, addExerciseLinkSearch, openReferralDrawer])

    const { searchInput, searchQuery, handleSearchChange } = useExerciseFilters()

    const nonCardioExercises = useMemo(
        () =>
            exercises.filter(
                (ex) =>
                    (ex.bodyPart || ex.target) !== 'cardio' &&
                    !(ex.equipment && CARDIO_EQUIPMENT.has(ex.equipment)),
            ),
        [exercises],
    )

    const browseableExercises = useMemo(
        () => nonCardioExercises.map(trackedToBrowseable),
        [nonCardioExercises],
    )

    const exerciseById = useMemo(
        () => new Map(nonCardioExercises.map((ex) => [ex.id, ex])),
        [nonCardioExercises],
    )

    const {
        browse,
        viewAll,
        pickZone,
        pickTarget,
        pickEquipment,
        goToStep,
        toggleViewAll,
    } = useExerciseCatalogBrowse()

    const isSearchMode = searchQuery.trim().length > 0
    const showTodaySection = !isSearchMode && browse.step === 'zone'
    const prevSearchQueryRef = useRef(searchQuery)

    useEffect(() => {
        const prev = prevSearchQueryRef.current.trim()
        const next = searchQuery.trim()
        if (prev && !next) {
            goToStep('zone', { replace: true })
        }
        prevSearchQueryRef.current = searchQuery
    }, [searchQuery, goToStep])

    useEffect(() => {
        if (isSearchMode) return
        if (browse.step === 'list' && (!browse.zone || !browse.target || !browse.beq)) {
            goToStep('zone', { replace: true })
        } else if (
            browse.step === 'equipment' &&
            (!browse.zone || !browse.target)
        ) {
            goToStep(browse.zone ? 'muscle' : 'zone', { replace: true })
        } else if (browse.step === 'muscle' && !browse.zone) {
            goToStep('zone', { replace: true })
        }
    }, [browse.step, browse.zone, browse.target, browse.beq, goToStep, isSearchMode])

    const getLatestPerfAt = useCallback(
        (id: string) => getLatestPerformanceCreatedAt(id),
        [],
    )

    const browseLeagueLookups = useMemo(() => {
        if (!browseLookupsRaw) return undefined
        return browseLookupsToMaps(browseLookupsRaw)
    }, [browseLookupsRaw])

    const todayExercises = useMemo(
        () =>
            sortBrowseableByLatestPerf(
                filterExercisesDoneToday(nonCardioExercises),
                getLatestPerfAt,
            ),
        [nonCardioExercises, getLatestPerfAt, performanceEntries],
    )

    const renderExerciseCard = useCallback(
        (ex: ExerciseWithPerf) => {
            const leagueInfo = ex.league ?? null
            return (
                <ExerciseCard
                    compact
                    exercise={ex}
                    lastPerf={ex.lastPerf}
                    personalBest={ex.personalBest}
                    leagueInfo={leagueInfo}
                    onClick={() => navigate(`/exercise/${ex.id}`, { replace: false })}
                    onSavePerf={(weight, reps) => {
                        const prevPB = ex.personalBest ?? null
                        void (async () => {
                            try {
                                const { xp } = await savePerformanceAndWait(
                                    ex.id,
                                    weight,
                                    reps,
                                )
                                notifyXpGrants(xp)
                                const nextPB = getPersonalBest(ex.id) ?? null
                                notifyPerfMilestones({
                                    exerciseName: ex.name,
                                    prevPB,
                                    nextPB,
                                    savedWeight: weight,
                                    savedReps: reps,
                                    league: xp?.league,
                                    exerciseImageUrl:
                                        getExerciseImageUrl(ex.gifUrl) || undefined,
                                    bodyPart: ex.bodyPart,
                                    target: ex.target,
                                })
                                navigate(`/exercise/${ex.id}`)
                            } finally {
                                void refreshAfterPerfChange()
                            }
                        })()
                    }}
                />
            )
        },
        [navigate, refreshAfterPerfChange],
    )

    const renderExerciseList = useCallback(
        (items: { id: string }[]) => (
            <ul className="space-y-3">
                {items.map((item) => {
                    const ex = exerciseById.get(item.id)
                    if (!ex) return null
                    return <li key={ex.id}>{renderExerciseCard(ex)}</li>
                })}
            </ul>
        ),
        [exerciseById, renderExerciseCard],
    )

    const hasTodaySection = todayExercises.length > 0

    const todaySection =
        hasTodaySection ? (
            <div data-tour="home-today">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                    <div className="flex flex-row items-center gap-1">
                        <div className="flex flex-col">
                            <BrowsePageTitle className="mb-0.5">{UI.homeDoneToday}</BrowsePageTitle>
                            <BrowseSectionTitle className="mb-1.5">
                                {UI.homeDoneTodaySubtitle}
                            </BrowseSectionTitle>
                        </div>
                        <div className="text-xs text-muted-foreground font-one-more">
                            /
                        </div>
                        <SessionTimingLabel
                            entries={todayEntries}
                            dayKey={todayKey}
                        />
                    </div>
                    {ownerUserId ? (
                        <button
                            type="button"
                            onClick={() =>
                                navigate(`/session/${ownerUserId}/${todayKey}`)
                            }
                            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground"
                        >
                            {UI.sessionViewDay}
                            <ChevronRight className="size-3.5" aria-hidden />
                        </button>
                    ) : null}
                </div>
                <ul className="space-y-3">
                    {todayExercises.map((ex) => (
                        <li key={ex.id}>{renderExerciseCard(ex)}</li>
                    ))}
                </ul>
            </div>
        ) : null

    return (
        <div className="min-h-screen-app bg-background">
            <main className="mx-auto max-w-2xl p-4 pt-safe-top">
                <UserProgressBanner dataTour="home-progress-banner" />

                {hasLoaded && nonCardioExercises.length > 0 ? (
                    <div className="mb-4 flex flex-col gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={UI.searchExercise}
                                value={searchInput}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="bg-card pl-9"
                            />
                        </div>

                    </div>
                ) : null}
                <Button className="w-full mb-4" onClick={goToAddExercise}>
                    <Plus className="mr-2 size-4" />
                    {UI.addExercise}
                </Button>
                {!hasLoaded ? (
                    <ExerciseCardSkeletonList count={5} compact className="mt-2" />
                ) : nonCardioExercises.length === 0 ? (
                    <EmptyState
                        className="mt-4"
                        icon={Dumbbell}
                        title={UI.noTrackedExercises}
                        description={UI.noTrackedDescription}
                    >
                        <Button className="mt-2 w-full" onClick={goToAddExercise}>
                            <Plus className="mr-2 size-4" />
                            {UI.addExercise}
                        </Button>
                    </EmptyState>
                ) : (
                    <>
                        {showTodaySection && todaySection ? (
                            <div className="mb-4">{todaySection}</div>
                        ) : null}
                        <div data-tour="home-browse">
                            <ExerciseBrowseNavigator
                                exercises={browseableExercises}
                                browse={browse}
                                pageTitle={UI.homeExercisesTitle}
                                searchQuery={searchQuery}
                                searchSort="latestPerf"
                                getLatestPerfAt={getLatestPerfAt}
                                viewAll={viewAll}
                                onToggleViewAll={toggleViewAll}
                                onPickZone={pickZone}
                                onPickTarget={pickTarget}
                                onPickEquipment={pickEquipment}
                                onGoToStep={goToStep}
                                leafSort="latestPerf"
                                browseLeagueLookups={browseLeagueLookups}
                                renderExerciseList={renderExerciseList}
                            />
                        </div>
                    </>
                )}
            </main>
            <HomeTour
                pageReady={hasLoaded && nonCardioExercises.length > 0}
                progressReady={progress != null}
                hasTodaySection={hasTodaySection}
            />
        </div>
    )
}

export default HomePage
