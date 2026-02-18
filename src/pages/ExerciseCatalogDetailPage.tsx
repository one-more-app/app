import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useTrackedExercises } from '@/hooks/use-tracked-exercises'
import { fetchExerciseById, getExerciseImageUrl } from '@/lib/exercisedb'
import { translateBodyPart, translateEquipment, translateTarget, UI } from '@/lib/translations'
import type { ExerciseDBExercise } from '@/types'
import { ArrowLeft, Dumbbell, Loader2, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

export function ExerciseCatalogDetailPage() {
    const { id } = useParams<{ id: string }>()
    const [exercise, setExercise] = useState<ExerciseDBExercise | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { exercises: tracked, addExercise } = useTrackedExercises()

    const trackedIds = new Set(
        tracked.map((e) => (e.isCustom ? e.exerciseId : `api-${e.exerciseId}`))
    )
    const isTracked = exercise ? trackedIds.has(`api-${exercise.id}`) : false

    useEffect(() => {
        if (!id) {
            setLoading(false)
            setError('ID manquant')
            return
        }
        let cancelled = false
        setLoading(true)
        setError(null)
        fetchExerciseById(id)
            .then((data) => {
                if (!cancelled) setExercise(data)
            })
            .catch((e) => {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => { cancelled = true }
    }, [id])

    const handleAdd = () => {
        if (!exercise || isTracked) return
        addExercise({
            exerciseId: exercise.id,
            name: exercise.name,
            bodyPart: exercise.bodyPart,
            target: exercise.target,
            equipment: exercise.equipment,
            gifUrl: exercise.gifUrl,
            isCustom: false,
        })
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
                <Button asChild>
                    <Link to="/exercises">{UI.back}</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-black px-4 py-4">
                <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/exercises">
                            <ArrowLeft className="size-5" />
                        </Link>
                    </Button>
                    <h1 className="flex-1 truncate text-lg font-semibold capitalize">
                        {exercise.name}
                    </h1>
                    <Button
                        size="sm"
                        disabled={isTracked}
                        onClick={handleAdd}
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
