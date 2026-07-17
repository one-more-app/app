import {
    BodyPartHealthIcon,
    TargetMuscleIcon,
} from '@/components/body-part-health-icon'
import { EquipmentIcon } from '@/components/equipment-icon'
import {
    BrowsePageTitle,
    BrowseSectionTitle,
    BrowseTile,
    CatalogBreadcrumb,
} from '@/components/exercise-browse-ui'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import {
    countByEquipment,
    countByTarget,
    countByZone,
    exercisesForBrowsePath,
    exercisesForBrowseScope,
    filterBrowseableBySearch,
    sortBrowseableByLatestPerf,
    type BrowseableExercise,
    type BrowseSearchSort,
    type CatalogBrowseParams,
    type CatalogBrowseStep,
} from '@/lib/exercise-catalog-browse'
import { sortExercisesByPopularity } from '@/lib/exercisedb'
import {
    browseEquipmentLeagueKey,
    type BrowseLeagueLookups,
} from '@/lib/muscle-league-stats'
import {
    translateBodyPart,
    translateEquipment,
    translateTarget,
    UI,
} from '@/lib/translations'
import type { ExerciseDBExercise } from '@/types'
import { Dumbbell, LayoutGrid, List } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'

export interface ExerciseBrowseNavigatorProps<T extends BrowseableExercise> {
    exercises: T[]
    browse: CatalogBrowseParams
    searchQuery: string
    searchSort?: BrowseSearchSort
    getLatestPerfAt?: (id: string) => number | null
    requireGif?: boolean
    isGifBroken?: (id: string) => boolean
    viewAll?: boolean
    onToggleViewAll?: () => void
    onPickZone: (zone: string) => void
    onPickTarget: (target: string) => void
    onPickEquipment: (equipment: string) => void
    onGoToStep: (step: CatalogBrowseStep) => void
    renderExerciseList: (exercises: T[]) => ReactNode
    beforeZoneStep?: ReactNode
    /** Titre principal au-dessus du sous-titre d'étape (ex. accueil, étape zone). */
    pageTitle?: string
    leafSort?: 'popularity' | 'latestPerf' | 'none'
    /** Paliers médians par étape du parcours (accueil uniquement). */
    browseLeagueLookups?: BrowseLeagueLookups
}

export function ExerciseBrowseNavigator<T extends BrowseableExercise>({
    exercises,
    browse,
    searchQuery,
    searchSort = 'popularity',
    getLatestPerfAt,
    requireGif = false,
    isGifBroken,
    viewAll = false,
    onToggleViewAll,
    onPickZone,
    onPickTarget,
    onPickEquipment,
    onGoToStep,
    renderExerciseList,
    beforeZoneStep,
    pageTitle,
    leafSort = 'popularity',
    browseLeagueLookups,
}: ExerciseBrowseNavigatorProps<T>) {
    const isSearchMode = searchQuery.trim().length > 0

    const pool = useMemo(() => {
        if (!requireGif) return exercises
        return exercises.filter(
            (ex) => ex.gifUrl?.trim() && !isGifBroken?.(ex.id),
        )
    }, [exercises, requireGif, isGifBroken])

    const searchResults = useMemo(() => {
        if (!isSearchMode) return []
        return filterBrowseableBySearch(
            pool,
            searchQuery,
            searchSort,
            getLatestPerfAt,
        )
    }, [pool, searchQuery, isSearchMode, searchSort, getLatestPerfAt])

    const zoneEntries = useMemo(() => countByZone(pool), [pool])
    const targetEntries = useMemo(
        () => (browse.zone ? countByTarget(pool, browse.zone) : []),
        [pool, browse.zone],
    )
    const equipmentEntries = useMemo(
        () =>
            browse.zone && browse.target
                ? countByEquipment(pool, browse.zone, browse.target)
                : [],
        [pool, browse.zone, browse.target],
    )

    const leafExercises = useMemo(() => {
        if (browse.step !== 'list' || !browse.zone || !browse.target || !browse.beq) {
            return [] as T[]
        }
        let list = exercisesForBrowsePath(
            pool,
            browse.zone,
            browse.target,
            browse.beq,
        )
        if (leafSort === 'latestPerf' && getLatestPerfAt) {
            list = sortBrowseableByLatestPerf(list, getLatestPerfAt)
        } else if (leafSort === 'popularity') {
            list = sortExercisesByPopularity(
                list as ExerciseDBExercise[],
            ) as T[]
        }
        return list
    }, [pool, browse, leafSort, getLatestPerfAt])

    const scopeExercises = useMemo(() => {
        if (!viewAll || browse.step === 'zone' || browse.step === 'list') {
            return [] as T[]
        }
        let list = exercisesForBrowseScope(
            pool,
            browse.zone,
            browse.step === 'equipment' ? browse.target : null,
        )
        if (leafSort === 'latestPerf' && getLatestPerfAt) {
            list = sortBrowseableByLatestPerf(list, getLatestPerfAt)
        } else if (leafSort === 'popularity') {
            list = sortExercisesByPopularity(
                list as ExerciseDBExercise[],
            ) as T[]
        }
        return list
    }, [pool, browse, viewAll, leafSort, getLatestPerfAt])

    const canToggleViewAll =
        !isSearchMode &&
        (browse.step === 'muscle' || browse.step === 'equipment') &&
        !!onToggleViewAll

    const showingViewAll = canToggleViewAll && viewAll

    const stepTitle = useMemo(() => {
        if (showingViewAll && browse.zone) {
            if (browse.step === 'equipment' && browse.target) {
                return UI.browseAllExercisesForMuscle.replace(
                    '{muscle}',
                    translateTarget(browse.target),
                )
            }
            return UI.browseAllExercisesInZone.replace(
                '{zone}',
                translateBodyPart(browse.zone),
            )
        }
        switch (browse.step) {
            case 'zone':
                return UI.browseChooseZone
            case 'muscle':
                return UI.browseChooseMuscle
            case 'equipment':
                return UI.browseChooseEquipment
            case 'list':
                return UI.browseChooseExercise
            default:
                return UI.browseChooseZone
        }
    }, [browse.step, browse.zone, browse.target, showingViewAll])

    if (isSearchMode) {
        return (
            <div data-tour="first-exercise-browse">
                <BrowseSectionTitle data-tour="first-exercise-browse-anchor">
                    {UI.browseSearchResults}
                </BrowseSectionTitle>
                {searchResults.length === 0 ? (
                    <EmptyState
                        className="mt-4"
                        icon={Dumbbell}
                        description={UI.noExerciseFound}
                        cardClassName="max-w-md shadow-none"
                    />
                ) : (
                    renderExerciseList(searchResults)
                )}
            </div>
        )
    }

    return (
        <div data-tour="first-exercise-browse">
            {browse.step === 'zone' && beforeZoneStep ? (
                <div className="mb-3">{beforeZoneStep}</div>
            ) : null}
            <CatalogBreadcrumb browse={browse} onGoTo={onGoToStep} />
            {pageTitle && browse.step === 'zone' && !showingViewAll ? (
                <BrowsePageTitle className="mb-0.5">{pageTitle}</BrowsePageTitle>
            ) : null}
            <div className="mb-2 flex flex-wrap items-center justify-between align-center gap-x-2 gap-y-1">
                <BrowseSectionTitle
                    className="mb-0"
                    data-tour="first-exercise-browse-anchor"
                >
                    {stepTitle}
                </BrowseSectionTitle>
                {canToggleViewAll ? (
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-6 shrink-0 px-2 text-[10px]"
                        onClick={onToggleViewAll}
                    >
                        {viewAll ? (
                            <>
                                <LayoutGrid className="mr-1 size-3.5" />
                                {UI.browseViewByCategory}
                            </>
                        ) : (
                            <>
                                <List className="mr-1 size-3.5" />
                                {UI.browseViewAll}
                            </>
                        )}
                    </Button>
                ) : null}
            </div>

            {showingViewAll ? renderExerciseList(scopeExercises) : null}

            {!showingViewAll && browse.step === 'zone' ? (
                <ul className="space-y-3">
                    {zoneEntries.map(({ zone, count }) => (
                        <li key={zone}>
                            <BrowseTile
                                label={translateBodyPart(zone)}
                                count={count}
                                leagueLevel={browseLeagueLookups?.byZone.get(
                                    zone.toLowerCase(),
                                )}
                                icon={
                                    <BodyPartHealthIcon
                                        bodyPart={zone}
                                        className="size-7"
                                    />
                                }
                                onClick={() => onPickZone(zone)}
                            />
                        </li>
                    ))}
                </ul>
            ) : null}

            {!showingViewAll && browse.step === 'muscle' && browse.zone ? (
                <ul className="space-y-3">
                    {targetEntries.map(({ target, count }) => (
                        <li key={target}>
                            <BrowseTile
                                label={translateTarget(target)}
                                count={count}
                                leagueLevel={browseLeagueLookups?.targetInZone
                                    .get(browse.zone.toLowerCase())
                                    ?.get(target.toLowerCase())}
                                icon={
                                    <TargetMuscleIcon
                                        target={target}
                                        className="size-7"
                                    />
                                }
                                onClick={() => onPickTarget(target)}
                            />
                        </li>
                    ))}
                </ul>
            ) : null}

            {!showingViewAll &&
                browse.step === 'equipment' &&
                browse.zone &&
                browse.target ? (
                <ul className="space-y-3">
                    {equipmentEntries.map(({ equipment, count }) => (
                        <li key={equipment}>
                            <BrowseTile
                                label={translateEquipment(equipment)}
                                count={count}
                                leagueLevel={browseLeagueLookups?.equipmentInPath.get(
                                    browseEquipmentLeagueKey(
                                        browse.zone,
                                        browse.target,
                                        equipment,
                                    ),
                                )}
                                icon={
                                    <EquipmentIcon
                                        equipment={equipment}
                                        className="size-7"
                                    />
                                }
                                onClick={() => onPickEquipment(equipment)}
                            />
                        </li>
                    ))}
                </ul>
            ) : null}

            {browse.step === 'list' ? renderExerciseList(leafExercises) : null}

            {!showingViewAll &&
                browse.step !== 'list' &&
                browse.step === 'muscle' &&
                targetEntries.length === 0 ? (
                <EmptyState
                    className="mt-4"
                    icon={Dumbbell}
                    description={UI.noExerciseInGroup}
                    cardClassName="shadow-none"
                />
            ) : null}
        </div>
    )
}
