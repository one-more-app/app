import { ExerciseBrowseNavigator } from '@/components/ExerciseBrowseNavigator'
import { ExerciseCard } from '@/components/ExerciseCard'
import { BrowsePageTitle } from '@/components/exercise-browse-ui'
import { ExerciseImage } from '@/components/ExerciseImage'
import { ExerciseTitle } from '@/components/ExerciseTitle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import type { TrackedExerciseWithPerformance } from '@/lib/data-api'
import type { CatalogBrowseParams, CatalogBrowseStep } from '@/lib/exercise-catalog-browse'
import { catalogToBrowseable } from '@/lib/exercise-catalog-browse'
import { hapticImpact } from '@/lib/haptics'
import { translateBodyPart, translateTarget, UI } from '@/lib/translations'
import type { ExerciseDBExercise } from '@/types'
import { Dumbbell, Plus } from 'lucide-react'
import { useMemo } from 'react'

export interface ExerciseCatalogBrowseProps {
    exercises: ExerciseDBExercise[]
    browse: CatalogBrowseParams
    searchQuery: string
    trackedIds: Set<string>
    /** Détails suivis (rang, dernier, record) indexés par `exerciseId` catalogue. */
    trackedByExerciseId?: Map<string, TrackedExerciseWithPerformance>
    viewAll?: boolean
    onToggleViewAll?: () => void
    onPickZone: (zone: string) => void
    onPickTarget: (target: string) => void
    onPickEquipment: (equipment: string) => void
    onGoToStep: (step: CatalogBrowseStep) => void
    onSelectExercise: (ex: ExerciseDBExercise) => void
    /** Clic sur un exo déjà suivi → fiche exercice. */
    onOpenTrackedExercise: (ex: ExerciseDBExercise) => void
    onAddExercise: (ex: ExerciseDBExercise) => void
    /** Enregistre une perf sur un exercice déjà suivi (drawer du ExerciseCard). */
    onSaveTrackedPerf: (
        ex: ExerciseDBExercise,
        weight: number,
        reps: number,
    ) => void
    tourAddButtonIndex?: number
    /** Titre au-dessus de l'étape zone (ex. « Tes exercices »). */
    pageTitle?: string
}

function isCatalogTracked(trackedIds: Set<string>, exerciseId: string) {
    return trackedIds.has(`api-${exerciseId}`)
}

function badgeLabel(ex: ExerciseDBExercise) {
    if (ex.target) return translateTarget(ex.target)
    if (ex.bodyPart) return translateBodyPart(ex.bodyPart)
    return null
}

function SectionHeader({
    title,
    chip,
    accent,
}: {
    title: string
    chip: string
    accent?: boolean
}) {
    return (
        <div className="mb-2 flex items-center justify-between gap-2">
            <BrowsePageTitle>{title}</BrowsePageTitle>
            <Badge
                variant="secondary"
                className={
                    accent
                        ? 'border-transparent bg-accent font-normal text-accent-foreground'
                        : 'font-normal'
                }
            >
                {chip}
            </Badge>
        </div>
    )
}

/** Suivis : ligne compacte maquette (thumb, nom, muscle, rang, +). Clic → fiche. */
function TrackedExerciseRows({
    exercises,
    trackedByExerciseId,
    onOpenTrackedExercise,
    onSaveTrackedPerf,
}: {
    exercises: ExerciseDBExercise[]
    trackedByExerciseId?: Map<string, TrackedExerciseWithPerformance>
    onOpenTrackedExercise: (ex: ExerciseDBExercise) => void
    onSaveTrackedPerf: (
        ex: ExerciseDBExercise,
        weight: number,
        reps: number,
    ) => void
}) {
    return (
        <ul className="space-y-3">
            {exercises.map((ex) => {
                const tracked = trackedByExerciseId?.get(ex.id)
                return (
                    <li key={ex.id}>
                        <ExerciseCard
                            compact
                            imageSize="sm"
                            exercise={{
                                id: tracked?.id ?? `api-${ex.id}`,
                                name: tracked?.name ?? ex.name,
                                originalName:
                                    tracked?.originalName ?? ex.name,
                                bodyPart: tracked?.bodyPart ?? ex.bodyPart,
                                target: tracked?.target ?? ex.target,
                                equipment: tracked?.equipment ?? ex.equipment,
                                gifUrl: tracked?.gifUrl ?? ex.gifUrl,
                                isCustom: false,
                            }}
                            lastPerf={tracked?.lastPerf ?? undefined}
                            personalBest={tracked?.personalBest ?? undefined}
                            leagueInfo={tracked?.league ?? undefined}
                            onClick={() => onOpenTrackedExercise(ex)}
                            onSavePerf={(weight, reps) =>
                                onSaveTrackedPerf(ex, weight, reps)
                            }
                        />
                    </li>
                )
            })}
        </ul>
    )
}

/** Grille catalogue (non suivis). */
function CatalogExerciseGrid({
    exercises,
    onSelectExercise,
    onAddExercise,
    tourAddButtonIndex = 0,
}: {
    exercises: ExerciseDBExercise[]
    onSelectExercise: (ex: ExerciseDBExercise) => void
    onAddExercise: (ex: ExerciseDBExercise) => void
    tourAddButtonIndex?: number
}) {
    return (
        <ul className="grid grid-cols-3 items-stretch gap-2">
            {exercises.map((ex, index) => {
                const label = badgeLabel(ex)
                return (
                    <li key={ex.id} className="flex min-w-0">
                        <Card className="flex h-full w-full flex-col gap-0 overflow-hidden py-0 shadow-none">
                            <button
                                type="button"
                                className="flex min-h-0 flex-1 flex-col text-left active:bg-muted/30"
                                onClick={() => {
                                    void hapticImpact()
                                    onSelectExercise(ex)
                                }}
                            >
                                <div className="relative aspect-square w-full shrink-0 bg-muted">
                                    <ExerciseImage
                                        gifUrl={ex.gifUrl}
                                        bodyPart={ex.bodyPart}
                                        target={ex.target}
                                        className="size-full"
                                        imgClassName="size-full object-cover"
                                        fallbackIconClassName="size-8 text-muted-foreground"
                                    />
                                </div>
                                <CardHeader className="flex shrink-0 flex-col gap-0.5 px-2 py-1.5 pb-1">
                                    <CardTitle className="text-[11px] leading-snug">
                                        <ExerciseTitle lines={2}>{ex.name}</ExerciseTitle>
                                    </CardTitle>
                                    <div className="flex min-h-4 items-start">
                                        {label ? (
                                            <Badge
                                                variant="secondary"
                                                className="max-w-full truncate px-1 py-0 text-[9px] leading-4"
                                            >
                                                {label}
                                            </Badge>
                                        ) : null}
                                    </div>
                                </CardHeader>
                            </button>
                            <div className="mt-auto shrink-0 border-t border-border px-1.5 py-1.5">
                                <Button
                                    size="sm"
                                    className="h-7 w-full px-1 text-[10px]"
                                    data-analytics-label={
                                        index === tourAddButtonIndex
                                            ? 'onboarding_first_exercise_add'
                                            : 'add_exercise'
                                    }
                                    data-tour={
                                        index === tourAddButtonIndex
                                            ? 'first-exercise-add'
                                            : undefined
                                    }
                                    onClick={() => onAddExercise(ex)}
                                >
                                    <Plus className="mr-0.5 size-3 shrink-0" />
                                    {UI.add}
                                </Button>
                            </div>
                        </Card>
                    </li>
                )
            })}
        </ul>
    )
}

function ExerciseCatalogSplitList({
    exercises,
    trackedIds,
    trackedByExerciseId,
    onSelectExercise,
    onOpenTrackedExercise,
    onAddExercise,
    onSaveTrackedPerf,
    tourAddButtonIndex = 0,
}: {
    exercises: ExerciseDBExercise[]
    trackedIds: Set<string>
    trackedByExerciseId?: Map<string, TrackedExerciseWithPerformance>
    onSelectExercise: (ex: ExerciseDBExercise) => void
    onOpenTrackedExercise: (ex: ExerciseDBExercise) => void
    onAddExercise: (ex: ExerciseDBExercise) => void
    onSaveTrackedPerf: (
        ex: ExerciseDBExercise,
        weight: number,
        reps: number,
    ) => void
    tourAddButtonIndex?: number
}) {
    const { tracked, available } = useMemo(() => {
        const nextTracked: ExerciseDBExercise[] = []
        const nextAvailable: ExerciseDBExercise[] = []
        for (const ex of exercises) {
            if (isCatalogTracked(trackedIds, ex.id)) nextTracked.push(ex)
            else nextAvailable.push(ex)
        }
        return { tracked: nextTracked, available: nextAvailable }
    }, [exercises, trackedIds])

    if (exercises.length === 0) {
        return (
            <EmptyState
                className="mt-4"
                icon={Dumbbell}
                description={UI.noExerciseFound}
                cardClassName="max-w-md shadow-none"
            />
        )
    }

    const trackedChip =
        tracked.length === 1
            ? UI.browseTrackedCountOne.replace('{count}', '1')
            : UI.browseTrackedCountMany.replace('{count}', String(tracked.length))
    const availableChip =
        available.length === 1
            ? UI.browseAvailableCountOne.replace('{count}', '1')
            : UI.browseAvailableCountMany.replace(
                  '{count}',
                  String(available.length),
              )

    // Index du bouton tour : premier exo non suivi dans la grille catalogue.
    const tourIndexInAvailable =
        tourAddButtonIndex >= 0 ? Math.min(tourAddButtonIndex, available.length - 1) : 0

    return (
        <div className="space-y-6">
            {tracked.length > 0 ? (
                <section aria-label={UI.browseYourExercisesTitle}>
                    <SectionHeader
                        title={UI.browseYourExercisesTitle}
                        chip={trackedChip}
                        accent
                    />
                    <TrackedExerciseRows
                        exercises={tracked}
                        trackedByExerciseId={trackedByExerciseId}
                        onOpenTrackedExercise={onOpenTrackedExercise}
                        onSaveTrackedPerf={onSaveTrackedPerf}
                    />
                </section>
            ) : null}
            {available.length > 0 ? (
                <section aria-label={UI.browseCatalogTitle}>
                    <SectionHeader
                        title={UI.browseCatalogTitle}
                        chip={availableChip}
                    />
                    <CatalogExerciseGrid
                        exercises={available}
                        onSelectExercise={onSelectExercise}
                        onAddExercise={onAddExercise}
                        tourAddButtonIndex={Math.max(0, tourIndexInAvailable)}
                    />
                </section>
            ) : null}
        </div>
    )
}

export function ExerciseCatalogBrowse({
    exercises,
    browse,
    searchQuery,
    trackedIds,
    trackedByExerciseId,
    viewAll,
    onToggleViewAll,
    onPickZone,
    onPickTarget,
    onPickEquipment,
    onGoToStep,
    onSelectExercise,
    onOpenTrackedExercise,
    onAddExercise,
    onSaveTrackedPerf,
    tourAddButtonIndex = 0,
    pageTitle,
}: ExerciseCatalogBrowseProps) {
    const browseable = exercises.map(catalogToBrowseable)
    const idToCatalog = new Map(exercises.map((ex) => [ex.id, ex]))

    return (
        <ExerciseBrowseNavigator
            exercises={browseable}
            browse={browse}
            searchQuery={searchQuery}
            searchSort="popularity"
            viewAll={viewAll}
            onToggleViewAll={onToggleViewAll}
            onPickZone={onPickZone}
            onPickTarget={onPickTarget}
            onPickEquipment={onPickEquipment}
            onGoToStep={onGoToStep}
            leafSort="popularity"
            pageTitle={pageTitle}
            isTracked={(ex) => isCatalogTracked(trackedIds, ex.id)}
            renderExerciseList={(items) => (
                <ExerciseCatalogSplitList
                    exercises={items
                        .map((b) => idToCatalog.get(b.id))
                        .filter((ex): ex is ExerciseDBExercise => !!ex)}
                    trackedIds={trackedIds}
                    trackedByExerciseId={trackedByExerciseId}
                    onSelectExercise={onSelectExercise}
                    onOpenTrackedExercise={onOpenTrackedExercise}
                    onAddExercise={onAddExercise}
                    onSaveTrackedPerf={onSaveTrackedPerf}
                    tourAddButtonIndex={tourAddButtonIndex}
                />
            )}
        />
    )
}
