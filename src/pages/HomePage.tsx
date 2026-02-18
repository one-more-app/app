import logo from '@/assets/logo-white.png'
import { NumberStepper } from '@/components/NumberStepper'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import type { ExerciseWithPerf } from '@/hooks/use-home-data'
import { useHomeData } from '@/hooks/use-home-data'
import { translateExerciseName } from '@/lib/exercise-translations'
import { getExerciseImageUrl } from '@/lib/exercisedb'
import { savePerformance } from '@/lib/storage'
import { UI, translateBodyPart, translateTarget } from '@/lib/translations'
import { Dumbbell, Plus, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function HomePage() {
    const { exercises, refresh } = useHomeData()
    const [perfModal, setPerfModal] = useState<ExerciseWithPerf | null>(null)
    const [weight, setWeight] = useState(0)
    const [reps, setReps] = useState(1)
    const [bodyPartFilter, setBodyPartFilter] = useState<string>('all')
    const navigate = useNavigate()

    const bodyParts = useMemo(() => {
        const parts = new Set(
            exercises
                .map((ex) => ex.bodyPart || ex.target)
                .filter((p): p is string => !!p)
        )
        return Array.from(parts).sort((a, b) => a.localeCompare(b))
    }, [exercises])

    const filteredExercises = useMemo(() => {
        if (bodyPartFilter === 'all') return exercises
        return exercises.filter(
            (ex) => (ex.bodyPart || ex.target) === bodyPartFilter
        )
    }, [exercises, bodyPartFilter])

    useEffect(() => {
        if (bodyPartFilter !== 'all' && !bodyParts.includes(bodyPartFilter)) {
            setBodyPartFilter('all')
        }
    }, [bodyParts, bodyPartFilter])

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-black p-4">
                <div className="mx-auto flex max-w-2xl items-center justify-between">
                    <img src={logo} alt="One More" className="h-8" />
                    <Button asChild size="sm">
                        <Link to="/exercises">
                            <Plus className="mr-2 size-4" />
                            {UI.addExercise}
                        </Link>
                    </Button>
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
                        {bodyParts.length > 0 && (
                            <div className="mb-4">
                                <Select value={bodyPartFilter} onValueChange={setBodyPartFilter}>
                                    <SelectTrigger className="w-full sm:w-[200px]">
                                        <SelectValue placeholder={UI.muscleGroup} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{UI.all}</SelectItem>
                                        {bodyParts.map((bp) => (
                                            <SelectItem key={bp} value={bp}>
                                                {translateBodyPart(bp)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <ul className="space-y-3">
                            {filteredExercises.map((ex) => (
                                <li key={ex.id}>
                                    <Card className="relative transition-colors hover:bg-muted/50 gap-2" onClick={() => {
                                        navigate(`/exercise/${ex.id}`)
                                    }}>
                                        <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                            {!ex.isCustom ? (
                                                <img
                                                    src={getExerciseImageUrl(ex.gifUrl)}
                                                    alt=""
                                                    className="size-14 rounded-lg object-cover bg-muted"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none'
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex size-14 items-center justify-center rounded-lg bg-muted">
                                                    <Dumbbell className="size-6 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <CardTitle className="truncate text-base">
                                                    {translateExerciseName(ex.name)}
                                                </CardTitle>
                                                {(ex.bodyPart || ex.target) && (
                                                    <Badge variant="secondary" className="mt-1">
                                                        {(ex.bodyPart && translateBodyPart(ex.bodyPart)) || (ex.target && translateTarget(ex.target)) || ex.bodyPart || ex.target}
                                                    </Badge>
                                                )}
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="accent"
                                                className="size-11 shrink-0 rounded-full"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    setPerfModal(ex)
                                                    setWeight(ex.lastPerf ? ex.lastPerf.weight : 0)
                                                    setReps(ex.lastPerf ? ex.lastPerf.reps : 1)
                                                }}
                                            >
                                                <Plus className="size-5" />
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="border-t pb-0">
                                            <div className="flex gap-4 text-sm">
                                                <div className="flex flex-1 flex-col items-start gap-1 rounded-lg border bg-muted/30 p-3">
                                                    <span className="text-muted-foreground">{UI.last}</span>
                                                    {ex.lastPerf ? (
                                                        <span className="flex items-center gap-1">
                                                            <span className="text-2xl font-bold italic text-primary">
                                                                {ex.lastPerf.weight}
                                                            </span>{' '}
                                                            kg × {ex.lastPerf.reps} reps
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
                                                    {ex.personalBest ? (
                                                        <span className="flex items-center gap-1">
                                                            <span className="text-2xl font-bold italic text-primary">
                                                                {ex.personalBest.weight}
                                                            </span>{' '}
                                                            kg × {ex.personalBest.reps} reps
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>

                                    </Card>
                                </li>
                            ))}
                        </ul>
                        {filteredExercises.length === 0 && bodyPartFilter !== 'all' && (
                            <p className="py-8 text-center text-muted-foreground">
                                {UI.noExerciseInGroup}
                            </p>
                        )}

                        <Dialog
                            open={!!perfModal}
                            onOpenChange={(open) => !open && setPerfModal(null)}
                        >
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>
                                        {UI.newPerf}
                                    </DialogTitle>
                                </DialogHeader>
                                {perfModal && (
                                    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                                        {!perfModal.isCustom ? (
                                            <img
                                                src={getExerciseImageUrl(perfModal.gifUrl)}
                                                alt=""
                                                className="size-12 rounded-lg object-cover bg-background"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none'
                                                }}
                                            />
                                        ) : (
                                            <div className="flex size-12 items-center justify-center rounded-lg bg-background">
                                                <Dumbbell className="size-6 text-muted-foreground" />
                                            </div>
                                        )}
                                        <span className="font-medium truncate">{translateExerciseName(perfModal.name)}</span>
                                    </div>
                                )}
                                <form
                                    className="space-y-6"
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        if (perfModal && weight > 0 && reps > 0) {
                                            savePerformance(perfModal.id, weight, reps)
                                            refresh()
                                            setPerfModal(null)
                                        }
                                    }}
                                >
                                    <div className="flex flex-col gap-6 w-full">
                                        <NumberStepper
                                            value={weight}
                                            onChange={setWeight}
                                            min={0}
                                            max={500}
                                            step={0.5}
                                            label={UI.weight}
                                            unit="kg"
                                            className="w-full"
                                        />
                                        <NumberStepper
                                            value={reps}
                                            onChange={setReps}
                                            min={1}
                                            max={100}
                                            step={1}
                                            label={UI.reps}
                                            className="w-full"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        size="lg"
                                        disabled={weight <= 0 || reps <= 0}
                                    >
                                        {UI.save}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </>
                )}
            </main>
        </div>
    )
}

export default HomePage
