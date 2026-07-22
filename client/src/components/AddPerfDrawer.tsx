import { HorizontalWheelPicker } from '@/components/HorizontalWheelPicker'
import { Button } from '@/components/ui/button'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer'
import { trackPerfDrawerOpened } from '@/lib/analytics'
import { hapticImpact, hapticImpactMedium } from '@/lib/haptics'
import { isBodyweightAdditiveExercise, isDumbbellExercise } from '@/lib/strength-standards'
import { UI } from '@/lib/translations'
import { useEffect, useRef, useState } from 'react'

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
    const [fieldStep, setFieldStep] = useState<'weight' | 'reps'>('weight')
    const weightRef = useRef(weight)
    const repsRef = useRef(reps)
    const formRef = useRef<HTMLFormElement>(null)

    const updateWeight = (v: number) => {
        weightRef.current = v
        setWeight(v)
    }
    const updateReps = (v: number) => {
        repsRef.current = v
        setReps(v)
    }

    useEffect(() => {
        if (open) {
            weightRef.current = initialWeight
            repsRef.current = initialReps
            setWeight(initialWeight)
            setReps(initialReps)
            setFieldStep('weight')
            void hapticImpactMedium()
            trackPerfDrawerOpened({
                mode: entryId && onUpdate ? 'edit' : 'add',
                trackedExerciseId: exercise.id,
                initialWeight,
                initialReps,
            })
        }
    }, [open, initialWeight, initialReps, entryId, onUpdate, exercise.id])

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
            weightRef.current = initialWeight
            repsRef.current = initialReps
            setWeight(initialWeight)
            setReps(initialReps)
            setFieldStep('weight')
        }
        onOpenChange(o)
    }

    const isEditMode = !!entryId && !!onUpdate
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const w = weightRef.current
        const r = repsRef.current
        if (w < 0 || r <= 0) return
        if (isEditMode && entryId) {
            onUpdate(entryId, w, r)
        } else if (onSave) {
            onSave(w, r)
        }
        void hapticImpact()
        handleOpenChange(false)
    }

    return (
        <Drawer
            open={open}
            onOpenChange={handleOpenChange}
            data-analytics-label={entryId && onUpdate ? 'edit_perf' : 'add_perf'}
        >
            <DrawerContent>
                <div className="w-full p-4">
                    <DrawerHeader>
                        <DrawerTitle>
                            {isEditMode ? UI.modifyPerf : UI.newPerf}
                        </DrawerTitle>
                    </DrawerHeader>
                    <form
                        ref={formRef}
                        key={exercise.id}
                        className="space-y-6 pt-4"
                        onSubmit={handleSubmit}
                    >
                        <div className="flex flex-col items-center gap-6 w-full">
                            <HorizontalWheelPicker
                                className="w-full"
                                value={weight}
                                onChange={updateWeight}
                                min={0}
                                max={500}
                                step={0.5}
                                label={weightLabel}
                                unit="kg"
                                autoFocus={open && fieldStep === 'weight'}
                                enterKeyHint="next"
                                onEnter={() => setFieldStep('reps')}
                            />
                            <HorizontalWheelPicker
                                className="w-full"
                                value={reps}
                                onChange={updateReps}
                                min={1}
                                max={100}
                                step={1}
                                label={UI.reps}
                                autoFocus={open && fieldStep === 'reps'}
                                enterKeyHint="done"
                                onEnter={() => formRef.current?.requestSubmit()}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={reps <= 0}
                            haptic={false}
                        >
                            {UI.save}
                        </Button>
                    </form>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
