import { PerformanceChart } from '@/components/PerformanceChart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { usePerformance } from '@/hooks/use-performance'
import { translateExerciseName } from '@/lib/exercise-translations'
import { getExerciseImageUrl } from '@/lib/exercisedb'
import { getTrackedExerciseById, removeTrackedExercise } from '@/lib/storage'
import { UI, translateBodyPart, translateTarget } from '@/lib/translations'
import { ArrowLeft, Dumbbell, Trash2, Trophy } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

export function ExerciseDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const exercise = id ? getTrackedExerciseById(id) : null
    const { entries, lastPerf, personalBest } = usePerformance(id ?? null)

    if (!exercise) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">{UI.exerciseNotFound}</p>
                <Button asChild>
                    <Link to="/">{UI.back}</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-black px-4 py-4">
                <div className="mx-auto flex max-w-2xl items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/">
                            <ArrowLeft className="size-5" />
                        </Link>
                    </Button>
                    <h1 className="truncate text-lg font-semibold">{translateExerciseName(exercise.name)}</h1>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
                <Card>
                    <CardHeader className="flex flex-row items-center">
                        {!exercise.isCustom ? (
                            <img
                                src={getExerciseImageUrl(exercise.gifUrl)}
                                alt=""
                                className="size-12 rounded-lg object-cover bg-muted"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                }}
                            />
                        ) : (
                            <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
                                <Dumbbell className="size-6 text-muted-foreground" />
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{translateExerciseName(exercise.name)}</p>
                            {(exercise.bodyPart || exercise.target) && (
                                <p className="text-xs text-muted-foreground">
                                    {exercise.bodyPart && (
                                        <Badge variant="secondary" className="mt-1">
                                            {translateBodyPart(exercise.bodyPart)}
                                        </Badge>
                                    )}
                                    {exercise.target && (
                                        <Badge variant="secondary" className="mt-1">
                                            {translateTarget(exercise.target)}
                                        </Badge>
                                    )}
                                </p>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="border-t pb-0">
                        <div className="flex gap-4 text-sm">
                            <div className="flex flex-1 flex-col items-start gap-1 rounded-lg border bg-muted/30 p-3">
                                <span className="text-muted-foreground">{UI.last}</span>
                                {lastPerf ? (
                                    <span className="flex items-center gap-1">
                                        <span className="text-2xl font-bold italic text-primary">
                                            {lastPerf.weight}
                                        </span>{' '}
                                        kg × {lastPerf.reps} reps
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">—</span>
                                )}
                            </div>
                            <div className="flex flex-1 flex-col items-start gap-1 rounded-lg border-2 border-accent/30 bg-accent/5 p-3">
                                <span className="flex items-center gap-1.5 text-primary font-medium">
                                    <Trophy className="size-4" />
                                    {UI.record}
                                </span>
                                {personalBest ? (
                                    <span className="flex items-center gap-1">
                                        <span className="text-2xl font-bold italic text-primary">
                                            {personalBest.weight}
                                        </span>{' '}
                                        kg × {personalBest.reps} reps
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">—</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {entries.length > 0 && (
                    <Card>
                        <CardHeader>
                            <h2 className="font-semibold">{UI.history} (poids)</h2>
                        </CardHeader>
                        <CardContent className="pl-0 pb-0">
                            <PerformanceChart entries={entries} />
                        </CardContent>
                    </Card>
                )}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <h2 className="font-semibold">{UI.options}</h2>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                if (id && confirm(UI.confirmDelete)) {
                                    removeTrackedExercise(id)
                                    navigate('/')
                                }
                            }}
                        >
                            <Trash2 className="mr-1 size-4" />
                            {UI.delete}
                        </Button>
                    </CardHeader>
                </Card>

            </main>
        </div>
    )
}
