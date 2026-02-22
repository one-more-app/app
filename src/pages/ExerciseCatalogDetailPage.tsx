import { HorizontalWheelPicker } from '@/components/HorizontalWheelPicker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer'
import { getExerciseById } from '@/data/popular-exercises'
import { useBack } from '@/hooks/use-back'
import { useTrackedExercises } from '@/hooks/use-tracked-exercises'
import { getExerciseImageUrl } from '@/lib/exercisedb'
import { savePerformance } from '@/lib/storage'
import { isBodyweightAdditiveExercise, isDumbbellExercise } from '@/lib/strength-standards'
import { translateBodyPart, translateEquipment, translateTarget, UI } from '@/lib/translations'
import type { ExerciseDBExercise } from '@/types'
import { ArrowLeft, Dumbbell, Loader2, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

function getWeightLabel(exercise: ExerciseDBExercise): string {
    const name = exercise.name
    const meta = exercise.equipment && exercise.target
        ? { equipment: exercise.equipment, target: exercise.target }
        : undefined
    if (isBodyweightAdditiveExercise(name, meta)) return UI.addedWeight
    if (isDumbbellExercise(name, meta)) return UI.weightPerDumbbell
    return UI.weight
}

export function ExerciseCatalogDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const goBack = useBack()
    const [exercise, setExercise] = useState<ExerciseDBExercise | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [addWithPerfOpen, setAddWithPerfOpen] = useState(false)
    const [perfWeight, setPerfWeight] = useState(0)
    const [perfReps, setPerfReps] = useState(1)
    const { exercises: tracked, addExercise } = useTrackedExercises()

    const trackedIds = new Set(
        tracked.map((e) => (e.isCustom ? e.exerciseId : `api-${e.exerciseId}`))
    )
    const isTracked = exercise ? trackedIds.has(`api-${exercise.id}`) : false

    useEffect(() => {
        if (!id) {
            setExercise(null)
            setLoading(false)
            setError('ID manquant')
            return
        }
        setError(null)
        const data = getExerciseById(id)
        setExercise(data)
        setLoading(false)
    }, [id])

    const openAddWithPerf = () => {
        if (!exercise || isTracked) return
        setPerfWeight(0)
        setPerfReps(1)
        setAddWithPerfOpen(true)
    }

    const handleAddWithPerfSubmit = () => {
        if (!exercise || perfReps <= 0) return
        const trackedId = `api-${exercise.id}`
        addExercise({
            exerciseId: exercise.id,
            name: exercise.name,
            originalName: exercise.name,
            bodyPart: exercise.bodyPart,
            target: exercise.target,
            equipment: exercise.equipment,
            gifUrl: exercise.gifUrl,
            isCustom: false,
        })
        savePerformance(trackedId, perfWeight, perfReps)
        setAddWithPerfOpen(false)
        navigate(`/exercise/${trackedId}`)
    }

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">{UI.loading}</p>
            </div>
        )
    }

    if (error || !exercise) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">{error ?? UI.exerciseNotFound}</p>
                <Button onClick={goBack}>{UI.back}</Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-black px-4 py-4">
                <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
                    <Button variant="ghost" size="icon" onClick={goBack}>
                        <ArrowLeft className="size-5" />
                    </Button>
                    <h1 className="flex-1 truncate text-lg font-semibold capitalize">
                        {exercise.name}
                    </h1>
                    <Button
                        size="sm"
                        disabled={isTracked}
                        onClick={openAddWithPerf}
                        className="shrink-0"
                    >
                        {isTracked ? UI.added : (
                            <>
                                <Plus className="mr-2 size-4" />
                                {UI.add}
                            </>
                        )}
                    </Button>
                </div>
            </header>

            <Drawer open={addWithPerfOpen} onOpenChange={setAddWithPerfOpen}>
                <DrawerContent>
                    <div className="w-full p-4">
                        <DrawerHeader>
                            <DrawerTitle>{UI.addAndRecordPerf}</DrawerTitle>
                        </DrawerHeader>
                        {exercise && (
                            <form
                                className="space-y-6 pt-4"
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    handleAddWithPerfSubmit()
                                }}
                            >
                                <div className="flex flex-col items-center gap-6 w-full">
                                    <HorizontalWheelPicker
                                        className="w-full"
                                        value={perfWeight}
                                        onChange={setPerfWeight}
                                        min={0}
                                        max={500}
                                        step={0.5}
                                        label={getWeightLabel(exercise)}
                                        unit="kg"
                                    />
                                    <HorizontalWheelPicker
                                        className="w-full"
                                        value={perfReps}
                                        onChange={setPerfReps}
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
                                    disabled={perfReps <= 0}
                                >
                                    {UI.save}
                                </Button>
                            </form>
                        )}
                    </div>
                </DrawerContent>
            </Drawer>

            <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
                <Card>
                    <CardHeader className="flex flex-row items-start gap-4">
                        {exercise.gifUrl ? (
                            <img
                                src={getExerciseImageUrl(exercise.gifUrl)}
                                alt=""
                                className="size-28 rounded-lg object-cover bg-muted shrink-0"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                }}
                            />
                        ) : (
                            <div className="flex size-28 items-center justify-center rounded-lg bg-muted shrink-0">
                                <Dumbbell className="size-10 text-muted-foreground" />
                            </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-2">
                            <h2 className="font-semibold text-lg capitalize">
                                {exercise.name}
                            </h2>
                            <div className="flex flex-wrap gap-1">
                                {exercise.bodyPart && (
                                    <Badge variant="secondary">
                                        {translateBodyPart(exercise.bodyPart)}
                                    </Badge>
                                )}
                                {exercise.target && (
                                    <Badge variant="secondary">
                                        {translateTarget(exercise.target)}
                                    </Badge>
                                )}
                                {exercise.equipment && (
                                    <Badge variant="outline">
                                        {translateEquipment(exercise.equipment)}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                    <Card>
                        <CardHeader>
                            <h3 className="font-semibold">{UI.secondaryMuscles}</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-1">
                                {exercise.secondaryMuscles.map((m) => (
                                    <Badge key={m} variant="secondary">
                                        {translateTarget(m)}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {exercise.instructions && exercise.instructions.length > 0 && (
                    <Card>
                        <CardHeader>
                            <h3 className="font-semibold">{UI.instructions}</h3>
                        </CardHeader>
                        <CardContent>
                            <ol className="space-y-2 list-decimal list-inside text-muted-foreground text-sm">
                                {exercise.instructions.map((step, i) => (
                                    <li key={i} className="leading-relaxed">
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    )
}
