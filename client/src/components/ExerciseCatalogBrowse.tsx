import { ExerciseBrowseNavigator } from '@/components/ExerciseBrowseNavigator'
import { ExerciseTitle } from '@/components/ExerciseTitle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import type { CatalogBrowseParams, CatalogBrowseStep } from '@/lib/exercise-catalog-browse'
import { catalogToBrowseable } from '@/lib/exercise-catalog-browse'
import { getExerciseImageUrl } from '@/lib/exercisedb'
import { hapticImpact } from '@/lib/haptics'
import { translateBodyPart, translateTarget, UI } from '@/lib/translations'
import type { ExerciseDBExercise } from '@/types'
import { Dumbbell, Plus } from 'lucide-react'

export interface ExerciseCatalogBrowseProps {
    exercises: ExerciseDBExercise[]
    browse: CatalogBrowseParams
    searchQuery: string
    trackedIds: Set<string>
    brokenImageIds: Set<string>
    viewAll?: boolean
    onToggleViewAll?: () => void
    onPickZone: (zone: string) => void
    onPickTarget: (target: string) => void
    onPickEquipment: (equipment: string) => void
    onGoToStep: (step: CatalogBrowseStep) => void
    onSelectExercise: (ex: ExerciseDBExercise) => void
    onAddExercise: (ex: ExerciseDBExercise) => void
    onImageError: (exId: string) => void
    tourAddButtonIndex?: number
}

function ExerciseCatalogGrid({
    exercises,
    trackedIds,
    onSelectExercise,
    onAddExercise,
    onImageError,
    tourAddButtonIndex = 0,
}: {
    exercises: ExerciseDBExercise[]
    trackedIds: Set<string>
    onSelectExercise: (ex: ExerciseDBExercise) => void
    onAddExercise: (ex: ExerciseDBExercise) => void
    onImageError: (exId: string) => void
    tourAddButtonIndex?: number
}) {
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

    const badgeLabel = (ex: ExerciseDBExercise) =>
        ex.target
            ? translateTarget(ex.target)
            : ex.bodyPart
                ? translateBodyPart(ex.bodyPart)
                : null

    return (
        <ul className="grid grid-cols-3 items-stretch gap-2">
            {exercises.map((ex, index) => {
                const isTracked = trackedIds.has(`api-${ex.id}`)
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
                                    <img
                                        src={getExerciseImageUrl(ex.gifUrl)}
                                        alt=""
                                        className="size-full object-cover"
                                        onError={() => onImageError(ex.id)}
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
                                    variant={isTracked ? 'secondary' : 'default'}
                                    disabled={isTracked}
                                    data-tour={
                                        index === tourAddButtonIndex && !isTracked
                                            ? 'first-exercise-add'
                                            : undefined
                                    }
                                    onClick={() => onAddExercise(ex)}
                                >
                                    {isTracked ? (
                                        UI.added
                                    ) : (
                                        <>
                                            <Plus className="mr-0.5 size-3 shrink-0" />
                                            {UI.add}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </li>
                )
            })}
        </ul>
    )
}

export function ExerciseCatalogBrowse({
    exercises,
    browse,
    searchQuery,
    trackedIds,
    brokenImageIds,
    viewAll,
    onToggleViewAll,
    onPickZone,
    onPickTarget,
    onPickEquipment,
    onGoToStep,
    onSelectExercise,
    onAddExercise,
    onImageError,
    tourAddButtonIndex = 0,
}: ExerciseCatalogBrowseProps) {
    const browseable = exercises.map(catalogToBrowseable)
    const idToCatalog = new Map(exercises.map((ex) => [ex.id, ex]))

    return (
        <ExerciseBrowseNavigator
            exercises={browseable}
            browse={browse}
            searchQuery={searchQuery}
            searchSort="popularity"
            requireGif
            isGifBroken={(id) => brokenImageIds.has(id)}
            viewAll={viewAll}
            onToggleViewAll={onToggleViewAll}
            onPickZone={onPickZone}
            onPickTarget={onPickTarget}
            onPickEquipment={onPickEquipment}
            onGoToStep={onGoToStep}
            leafSort="popularity"
            renderExerciseList={(items) => (
                <ExerciseCatalogGrid
                    exercises={items
                        .map((b) => idToCatalog.get(b.id))
                        .filter((ex): ex is ExerciseDBExercise => !!ex)}
                    trackedIds={trackedIds}
                    onSelectExercise={onSelectExercise}
                    onAddExercise={onAddExercise}
                    onImageError={onImageError}
                    tourAddButtonIndex={tourAddButtonIndex}
                />
            )}
        />
    )
}
