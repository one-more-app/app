import { HorizontalWheelPicker } from '@/components/HorizontalWheelPicker'
import { Button } from '@/components/ui/button'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer'
import { isBodyweightAdditiveExercise, isDumbbellExercise } from '@/lib/strength-standards'
import { UI } from '@/lib/translations'
import { useEffect, useState } from 'react'

export interface AddPerfDrawerExercise {
    id: string
    name: string
    originalName?: string
    equipment?: string
    target?: string
}

interface AddPerfDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    exercise: AddPerfDrawerExercise
    initialWeight: number
    initialReps: number
    /** Mode ajout : sauvegarde une nouvelle perf */
    onSave?: (weight: number, reps: number) => void
    /** Mode modification : met à jour une perf existante */
    entryId?: string
    onUpdate?: (entryId: string, weight: number, reps: number) => void
}

export function AddPerfDrawer({
    open,
    onOpenChange,
    exercise,
    initialWeight,
    initialReps,
    onSave,
    entryId,
    onUpdate,
}: AddPerfDrawerProps) {
    const [weight, setWeight] = useState(initialWeight)
    const [reps, setReps] = useState(initialReps)

    useEffect(() => {
        if (open) {
            setWeight(initialWeight)
            setReps(initialReps)
        }
    }, [open, initialWeight, initialReps])

    const exerciseName = exercise.originalName ?? exercise.name
    const metadata =
        exercise.equipment && exercise.target
            ? { equipment: exercise.equipment, target: exercise.target }
            : undefined

    const weightLabel = isBodyweightAdditiveExercise(exerciseName, metadata)
        ? UI.addedWeight
        : isDumbbellExercise(exerciseName, metadata)
          ? UI.weightPerDumbbell
          : UI.weight

    const handleOpenChange = (o: boolean) => {
        if (!o) {
            setWeight(initialWeight)
            setReps(initialReps)
        }
        onOpenChange(o)
    }

    const isEditMode = !!entryId && !!onUpdate
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (weight < 0 || reps <= 0) return
        if (isEditMode && entryId) {
            onUpdate(entryId, weight, reps)
        } else if (onSave) {
            onSave(weight, reps)
        }
        handleOpenChange(false)
    }

    return (
        <Drawer open={open} onOpenChange={handleOpenChange}>
            <DrawerContent>
                <div className="w-full p-4">
                    <DrawerHeader>
                        <DrawerTitle>
                            {isEditMode ? UI.modifyPerf : UI.newPerf}
                        </DrawerTitle>
                    </DrawerHeader>
                    <form
                        key={exercise.id}
                        className="space-y-6 pt-4"
                        onSubmit={handleSubmit}
                    >
                        <div className="flex flex-col items-center gap-6 w-full">
                            <HorizontalWheelPicker
                                className="w-full"
                                value={weight}
                                onChange={setWeight}
                                min={0}
                                max={500}
                                step={0.5}
                                label={weightLabel}
                                unit="kg"
                            />
                            <HorizontalWheelPicker
                                className="w-full"
                                value={reps}
                                onChange={setReps}
                                min={1}
                                max={100}
                                step={1}
                                label={UI.reps}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={reps <= 0}
                        >
                            {UI.save}
                        </Button>
                    </form>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
