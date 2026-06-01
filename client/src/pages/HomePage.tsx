import { ExerciseBrowseNavigator } from '@/components/ExerciseBrowseNavigator'
import { ExerciseCard } from '@/components/ExerciseCard'
import { UserProgressBanner } from '@/components/UserProgressBanner'
import { BrowseSectionTitle } from '@/components/exercise-browse-ui'
import { ExerciseCardSkeletonList } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { usePerformanceDataRefresh, useUserProfileData } from '@/hooks/use-api-data'
import { useExerciseCatalogBrowse } from '@/hooks/use-exercise-catalog-browse'
import { useExerciseFilters } from '@/hooks/use-exercise-filters'
import { useHomeData, type ExerciseWithPerf } from '@/hooks/use-home-data'
import {
    sortBrowseableByLatestPerf,
    trackedToBrowseable,
} from '@/lib/exercise-catalog-browse'
import { CARDIO_EQUIPMENT, getExerciseImageUrl } from '@/lib/exercisedb'
import { filterExercisesDoneToday } from '@/lib/home-today-exercises'
import { computeBrowseLeagueLookups } from '@/lib/muscle-league-stats'
import { computeLeagueFromPB, notifyPerfMilestones } from '@/lib/perf-notifications'
import {
    getLatestPerformanceCreatedAt,
    getPersonalBest,
    savePerformanceAndWait,
} from '@/lib/storage'
import { getLeagueInfo } from '@/lib/strength-standards'
import { UI } from '@/lib/translations'
import { notifyXpGrants } from '@/lib/xp-notifications'
import { Dumbbell, Plus, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

function HomePage() {
    const { exercises, hasLoaded } = useHomeData()
    const refreshAfterPerfChange = usePerformanceDataRefresh()
    const { data: profile } = useUserProfileData()
    const navigate = useNavigate()
    const location = useLocation()

    const { searchInput, searchQuery, handleSearchChange } = useExerciseFilters()

    const addExerciseLinkSearch = useMemo(() => {
        const q = new URLSearchParams(location.search).get('q')
        return q ? `?q=${encodeURIComponent(q)}` : ''
    }, [location.search])

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

    const { browse, pickZone, pickTarget, pickEquipment, goToStep } =
        useExerciseCatalogBrowse()

    const isSearchMode = searchQuery.trim().length > 0
    const showTodaySection = !isSearchMode && browse.step === 'zone'
    const prevSearchQueryRef = useRef(searchQuery)

    useEffect(() => {
        const prev = prevSearchQueryRef.current.trim()
        const next = searchQuery.trim()
        if (prev && !next) {
            goToStep('zone')
        }
        prevSearchQueryRef.current = searchQuery
    }, [searchQuery, goToStep])

    useEffect(() => {
        if (isSearchMode) return
        if (browse.step === 'list' && (!browse.zone || !browse.target || !browse.beq)) {
            goToStep('zone')
        } else if (
            browse.step === 'equipment' &&
            (!browse.zone || !browse.target)
        ) {
            goToStep(browse.zone ? 'muscle' : 'zone')
        } else if (browse.step === 'muscle' && !browse.zone) {
            goToStep('zone')
        }
    }, [browse.step, browse.zone, browse.target, browse.beq, goToStep, isSearchMode])

    const getLatestPerfAt = useCallback(
        (id: string) => getLatestPerformanceCreatedAt(id),
        [],
    )

    const browseLeagueLookups = useMemo(() => {
        if (!profile) return undefined
        return computeBrowseLeagueLookups(nonCardioExercises, profile)
    }, [nonCardioExercises, profile])

    const todayExercises = useMemo(
        () =>
            sortBrowseableByLatestPerf(
                filterExercisesDoneToday(nonCardioExercises),
                getLatestPerfAt,
            ),
        [nonCardioExercises, getLatestPerfAt, exercises],
    )

    const renderExerciseCard = useCallback(
        (ex: ExerciseWithPerf) => {
            const leagueInfo =
                !ex.isCustom && ex.personalBest && profile
                    ? getLeagueInfo({
                        weight: ex.personalBest.weight,
                        reps: ex.personalBest.reps,
                        bodyWeightKg: profile.weightKg,
                        gender: profile.gender,
                        exerciseName: ex.originalName ?? ex.name,
                        exerciseMetadata:
                            ex.equipment && ex.target
                                ? {
                                    equipment: ex.equipment,
                                    target: ex.target,
                                    bodyPart: ex.bodyPart,
                                }
                                : undefined,
                    })
                    : null
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
                        const prevLeague = leagueInfo ?? null
                        void (async () => {
                            try {
                                const { xp } = await savePerformanceAndWait(
                                    ex.id,
                                    weight,
                                    reps,
                                )
                                notifyXpGrants(xp)
                                const nextPB = getPersonalBest(ex.id) ?? null
                                const nextLeague = profile
                                    ? computeLeagueFromPB({
                                        exercise: ex,
                                        personalBest: nextPB,
                                        profile,
                                    })
                                    : null
                                notifyPerfMilestones({
                                    exerciseName: ex.name,
                                    prevPB,
                                    nextPB,
                                    savedWeight: weight,
                                    savedReps: reps,
                                    prevLeague,
                                    nextLeague,
                                    exerciseImageUrl:
                                        getExerciseImageUrl(ex.gifUrl) || undefined,
                                })
                            } finally {
                                void refreshAfterPerfChange()
                            }
                        })()
                    }}
                />
            )
        },
        [navigate, profile, refreshAfterPerfChange],
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

    const todaySection =
        todayExercises.length > 0 ? (
            <div>
                <BrowseSectionTitle className="mb-1.5">{UI.homeDoneToday}</BrowseSectionTitle>
                <ul className="space-y-3">
                    {todayExercises.map((ex) => (
                        <li key={ex.id}>{renderExerciseCard(ex)}</li>
                    ))}
                </ul>
            </div>
        ) : null

    return (
        <div className="min-h-screen-app bg-background">
            <main className="mx-auto max-w-2xl p-4">
                <UserProgressBanner />

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
                <Button asChild className="h-9 w-full mb-4">
                    <Link to={`/exercises${addExerciseLinkSearch}`}>
                        <Plus className="mr-2 size-4" />
                        {UI.addExercise}
                    </Link>
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
                        <Button asChild className="mt-2">
                            <Link to={`/exercises${addExerciseLinkSearch}`}>
                                <Plus className="mr-2 size-4" />
                                {UI.addExercise}
                            </Link>
                        </Button>
                    </EmptyState>
                ) : (
                    <>
                        {showTodaySection && todaySection ? (
                            <div className="mb-4">{todaySection}</div>
                        ) : null}
                        <ExerciseBrowseNavigator
                            exercises={browseableExercises}
                            browse={browse}
                            searchQuery={searchQuery}
                            searchSort="latestPerf"
                            getLatestPerfAt={getLatestPerfAt}
                            onPickZone={pickZone}
                            onPickTarget={pickTarget}
                            onPickEquipment={pickEquipment}
                            onGoToStep={goToStep}
                            leafSort="latestPerf"
                            browseLeagueLookups={browseLeagueLookups}
                            renderExerciseList={renderExerciseList}
                        />
                    </>
                )}
            </main>
        </div>
    )
}

export default HomePage
