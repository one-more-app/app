import logo from '@/assets/logo-white.png'
import { ExerciseCard } from '@/components/ExerciseCard'
import { ExerciseSearchFilters } from '@/components/ExerciseSearchFilters'
import { Button } from '@/components/ui/button'
import { useExerciseFilters } from '@/hooks/use-exercise-filters'
import { useHomeData } from '@/hooks/use-home-data'
import { translateSearchQueryToEnglish } from '@/lib/exercise-translations'
import { CARDIO_EQUIPMENT } from '@/lib/exercisedb'
import { getPersonalBest, getUserProfile, savePerformance } from '@/lib/storage'
import { computeLeagueFromPB, notifyPerfMilestones } from '@/lib/perf-notifications'
import { getLeagueInfo } from '@/lib/strength-standards'
import { equipmentMatchesFilter, getGroupedEquipmentList, UI } from '@/lib/translations'
import { Dumbbell, Plus, Settings } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function HomePage() {
    const { exercises, hasLoaded, refresh } = useHomeData()
    const navigate = useNavigate()

    const {
        searchInput,
        searchQuery,
        targetFilter,
        equipmentFilter,
        bodyPartFilter = 'all',
        handleTargetChange,
        handleEquipmentChange,
        handleBodyPartChange,
        handleSearchChange,
    } = useExerciseFilters({ includeBodyPart: true })

    const nonCardioExercises = useMemo(
        () =>
            exercises.filter(
                (ex) =>
                    (ex.bodyPart || ex.target) !== 'cardio' &&
                    !(ex.equipment && CARDIO_EQUIPMENT.has(ex.equipment))
            ),
        [exercises]
    )

    const bodyParts = useMemo(() => {
        const parts = new Set(
            nonCardioExercises
                .map((ex) => ex.bodyPart)
                .filter((p): p is string => !!p)
        )
        return Array.from(parts).sort((a, b) => a.localeCompare(b))
    }, [nonCardioExercises])

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

    const filteredExercises = useMemo(() => {
        let list = nonCardioExercises
        if (bodyPartFilter !== 'all') {
            list = list.filter((ex) => ex.bodyPart === bodyPartFilter)
        }
        if (targetFilter !== 'all') {
            list = list.filter((ex) => ex.target === targetFilter)
        }
        if (equipmentFilter !== 'all') {
            list = list.filter((ex) => equipmentMatchesFilter(ex.equipment, equipmentFilter))
        }
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
        return list
    }, [nonCardioExercises, bodyPartFilter, targetFilter, equipmentFilter, searchQuery])

    // Réinitialiser les filtres si les options ne les contiennent plus (ex: exercice supprimé).
    // Ne s'exécute qu'après chargement des données pour éviter de réinitialiser à tort au retour
    // arrière (quand exercises est encore vide, bodyParts/targets/equipmentList le seraient aussi).
    useEffect(() => {
        if (!hasLoaded) return
        if (bodyPartFilter !== 'all' && !bodyParts.includes(bodyPartFilter)) {
            handleBodyPartChange('all')
        }
        if (targetFilter !== 'all' && !targets.includes(targetFilter)) {
            handleTargetChange('all')
        }
        if (equipmentFilter !== 'all' && !equipmentList.includes(equipmentFilter)) {
            handleEquipmentChange('all')
        }
    }, [
        hasLoaded,
        bodyParts,
        bodyPartFilter,
        targets,
        targetFilter,
        equipmentList,
        equipmentFilter,
        handleBodyPartChange,
        handleTargetChange,
        handleEquipmentChange,
    ])

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-black p-4">
                <div className="mx-auto flex max-w-2xl items-center justify-between">
                    <img src={logo} alt="One More" className="h-8" />
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                            <Link to="/settings">
                                <Settings className="size-5" />
                            </Link>
                        </Button>
                        <Button asChild size="sm">
                            <Link to="/exercises">
                                <Plus className="mr-2 size-4" />
                                {UI.addExercise}
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-2xl p-4">
                {exercises.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Dumbbell className="mb-4 size-12 text-accent" />
                        <h2 className="mb-2 text-lg font-medium">{UI.noTrackedExercises}</h2>
                        <p className="mb-6 text-muted-foreground">
                            {UI.noTrackedDescription}
                        </p>
                        <Button asChild>
                            <Link to="/exercises">
                                <Plus className="mr-2 size-4" />
                                {UI.chooseExercises}
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        <ExerciseSearchFilters
                            searchInput={searchInput}
                            onSearchChange={handleSearchChange}
                            targetFilter={targetFilter}
                            onTargetFilterChange={handleTargetChange}
                            targets={targets}
                            equipmentFilter={equipmentFilter}
                            onEquipmentFilterChange={handleEquipmentChange}
                            equipmentList={equipmentList}
                            onBodyPartFilterChange={handleBodyPartChange}
                            bodyParts={bodyParts}
                        />
                        <ul className="space-y-3">
                            {filteredExercises.map((ex) => {
                                const profile = getUserProfile()
                                const leagueInfo =
                                    !ex.isCustom && ex.personalBest
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
                                                savePerformance(ex.id, weight, reps)
                                                const nextPB = getPersonalBest(ex.id) ?? null
                                                const profile = getUserProfile()
                                                const nextLeague = computeLeagueFromPB({
                                                    exercise: ex,
                                                    personalBest: nextPB,
                                                    profile,
                                                })

                                                notifyPerfMilestones({
                                                    exerciseName: ex.name,
                                                    prevPB,
                                                    nextPB,
                                                    prevLeague,
                                                    nextLeague,
                                                })
                                                refresh()
                                            }}
                                        />
                                    </li>
                                )
                            })}
                        </ul>
                        {filteredExercises.length === 0 &&
                            (bodyPartFilter !== 'all' ||
                                targetFilter !== 'all' ||
                                equipmentFilter !== 'all' ||
                                searchQuery.trim()) && (
                                <p className="py-8 text-center text-muted-foreground">
                                    {UI.noExerciseFound}
                                </p>
                            )}
                    </>
                )}
            </main>
        </div>
    )
}

export default HomePage
