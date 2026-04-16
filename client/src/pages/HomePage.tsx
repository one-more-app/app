import { ExerciseCard } from '@/components/ExerciseCard'
import { ExerciseSearchFilters } from '@/components/ExerciseSearchFilters'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useExerciseFilters } from '@/hooks/use-exercise-filters'
import { usePerformanceDataRefresh } from '@/hooks/use-api-data'
import { useHomeData } from '@/hooks/use-home-data'
import { useUserProfileData } from '@/hooks/use-api-data'
import {
    buildEquipmentByParent,
    exerciseMatchesEquipmentSelection,
    isEquipmentSelectionEmpty,
    sanitizeEquipmentSelection,
    serializeEquipmentSelection,
} from '@/lib/equipment-filter'
import { getExerciseImageUrl } from '@/lib/exercisedb'
import { translateSearchQueryToEnglish } from '@/lib/exercise-translations'
import { CARDIO_EQUIPMENT } from '@/lib/exercisedb'
import {
    exerciseMatchesMuscleSelection,
    isMuscleSelectionEmpty,
    sanitizeMuscleSelection,
    serializeMuscleSelection,
} from '@/lib/muscle-filter'
import { computeLeagueFromPB, notifyPerfMilestones } from '@/lib/perf-notifications'
import {
    getLatestPerformanceCreatedAt,
    getPersonalBest,
    savePerformanceAndWait,
} from '@/lib/storage'
import { getLeagueInfo } from '@/lib/strength-standards'
import { getGroupedEquipmentList, UI } from '@/lib/translations'
import { Dumbbell, Plus } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function HomePage() {
    const { exercises, hasLoaded } = useHomeData()
    const refreshAfterPerfChange = usePerformanceDataRefresh()
    const { data: profile } = useUserProfileData()
    const navigate = useNavigate()

    const {
        searchInput,
        searchQuery,
        muscleFilter,
        equipmentFilter,
        handleMuscleFilterChange,
        handleEquipmentChange,
        handleSearchChange,
    } = useExerciseFilters()

    const nonCardioExercises = useMemo(
        () =>
            exercises.filter(
                (ex) =>
                    (ex.bodyPart || ex.target) !== 'cardio' &&
                    !(ex.equipment && CARDIO_EQUIPMENT.has(ex.equipment))
            ),
        [exercises]
    )

    const targets = useMemo(() => {
        const t = new Set(
            nonCardioExercises.map((ex) => ex.target).filter((p): p is string => !!p)
        )
        return Array.from(t).sort((a, b) => a.localeCompare(b))
    }, [nonCardioExercises])

    const equipmentList = useMemo(() => {
        const eq = new Set(
            nonCardioExercises.map((ex) => ex.equipment).filter((p): p is string => !!p)
        )
        return getGroupedEquipmentList(Array.from(eq))
    }, [nonCardioExercises])
    const availableRawEquipment = useMemo(() => {
        const eq = new Set(
            nonCardioExercises.map((ex) => ex.equipment).filter((p): p is string => !!p)
        )
        return Array.from(eq)
    }, [nonCardioExercises])

    const filteredExercises = useMemo(() => {
        let list = nonCardioExercises
        list = list.filter((ex) => exerciseMatchesMuscleSelection(ex, muscleFilter))
        list = list.filter((ex) =>
            exerciseMatchesEquipmentSelection(ex.equipment, equipmentFilter))
        const apiQuery = searchQuery.trim()
            ? translateSearchQueryToEnglish(searchQuery.trim()).toLowerCase()
            : ''
        const searchRaw = searchQuery.trim().toLowerCase()
        if (apiQuery || searchRaw) {
            list = list.filter((ex) => {
                const name = ex.name.toLowerCase()
                const orig = (ex.originalName ?? ex.name).toLowerCase()
                const matchEn = (apiQuery && name.includes(apiQuery)) || (apiQuery && orig.includes(apiQuery))
                const matchFr = searchRaw && (name.includes(searchRaw) || orig.includes(searchRaw))
                return matchEn || matchFr
            })
        }
        list = [...list].sort((a, b) => {
            const ta = getLatestPerformanceCreatedAt(a.id)
            const tb = getLatestPerformanceCreatedAt(b.id)
            if (ta !== null && tb !== null) return tb - ta
            if (ta !== null) return -1
            if (tb !== null) return 1
            return 0
        })
        return list
    }, [nonCardioExercises, muscleFilter, equipmentFilter, searchQuery])

    // Retire muscles / groupes qui ne correspondent plus aux exercices suivis.
    useEffect(() => {
        if (!hasLoaded) return
        const next = sanitizeMuscleSelection(muscleFilter, targets)
        if (serializeMuscleSelection(next) !== serializeMuscleSelection(muscleFilter)) {
            handleMuscleFilterChange(next)
        }
        const tree = buildEquipmentByParent(equipmentList, availableRawEquipment)
        const nextEq = sanitizeEquipmentSelection(equipmentFilter, tree)
        if (serializeEquipmentSelection(nextEq) !== serializeEquipmentSelection(equipmentFilter)) {
            handleEquipmentChange(nextEq)
        }
    }, [
        hasLoaded,
        targets,
        muscleFilter,
        equipmentList,
        availableRawEquipment,
        equipmentFilter,
        handleMuscleFilterChange,
        handleEquipmentChange,
    ])

    return (
        <div className="min-h-screen-app bg-background">
            <main className="mx-auto max-w-2xl p-4">
                <ExerciseSearchFilters
                    searchInput={searchInput}
                    onSearchChange={handleSearchChange}
                    muscleFilter={muscleFilter}
                    onMuscleFilterChange={handleMuscleFilterChange}
                    targets={targets}
                    equipmentFilter={equipmentFilter}
                    onEquipmentFilterChange={handleEquipmentChange}
                    equipmentList={equipmentList}
                    availableRawEquipment={availableRawEquipment}
                />

                <div className="mb-4">
                    <Button size="sm" asChild className="w-full">
                        <Link to="/exercises">
                            <Plus className="mr-2 size-4" />
                            {UI.addExercise}
                        </Link>
                    </Button>
                </div>

                {nonCardioExercises.length === 0 ? (
                    <EmptyState
                        className="mt-4"
                        icon={Dumbbell}
                        title={UI.noTrackedExercises}
                        description={UI.noTrackedDescription}
                    />
                ) : (
                    <>
                        <ul className="space-y-3">
                            {filteredExercises.map((ex) => {
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
                                                    ? { equipment: ex.equipment, target: ex.target, bodyPart: ex.bodyPart }
                                                    : undefined,
                                        })
                                        : null
                                return (
                                    <li key={ex.id}>
                                        <ExerciseCard
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
                                                        await savePerformanceAndWait(ex.id, weight, reps)
                                                        const nextPB = getPersonalBest(ex.id) ?? null
                                                        const nextLeague =
                                                            profile
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
                                                            prevLeague,
                                                            nextLeague,
                                                            exerciseImageUrl:
                                                                getExerciseImageUrl(
                                                                    ex.gifUrl,
                                                                ) || undefined,
                                                        })
                                                    } finally {
                                                        void refreshAfterPerfChange()
                                                    }
                                                })()
                                            }}
                                        />
                                    </li>
                                )
                            })}
                        </ul>

                        {filteredExercises.length === 0 &&
                            (!isMuscleSelectionEmpty(muscleFilter) ||
                                !isEquipmentSelectionEmpty(equipmentFilter) ||
                                searchQuery.trim()) && (
                                <EmptyState
                                    className="mt-6"
                                    icon={Dumbbell}
                                    iconClassName="text-accent"
                                    description={UI.noExerciseFound}
                                    cardClassName="max-w-md shadow-none"
                                />
                            )}
                    </>
                )}
            </main>
        </div>
    )
}

export default HomePage
