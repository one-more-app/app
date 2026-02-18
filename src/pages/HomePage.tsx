import logo from '@/assets/logo-white.png'
import { ExerciseCard } from '@/components/ExerciseCard'
import { HorizontalWheelPicker } from '@/components/HorizontalWheelPicker'
import { Button } from '@/components/ui/button'
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import type { ExerciseWithPerf } from '@/hooks/use-home-data'
import { useHomeData } from '@/hooks/use-home-data'
import { getLastPerformance, getUserProfile, savePerformance } from '@/lib/storage'
import { getLeagueInfo } from '@/lib/strength-standards'
import { UI, translateBodyPart } from '@/lib/translations'
import { Dumbbell, Plus, Settings } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function HomePage() {
    const { exercises, refresh } = useHomeData()
    const [drawerState, setDrawerState] = useState<{
        exercise: ExerciseWithPerf
        weight: number
        reps: number
    } | null>(null)
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
                            {filteredExercises.map((ex) => {
                                const profile = getUserProfile()
                                const leagueInfo =
                                    !ex.isCustom && ex.personalBest
                                        ? getLeagueInfo({
                                            weight: ex.personalBest.weight,
                                            reps: ex.personalBest.reps,
                                            bodyWeightKg: profile.weightKg,
                                            gender: profile.gender,
                                            exerciseName: ex.name,
                                        })
                                        : null
                                return (
                                <li key={ex.id}>
                                    <ExerciseCard
                                        exercise={ex}
                                        lastPerf={ex.lastPerf}
                                        personalBest={ex.personalBest}
                                        leagueInfo={leagueInfo}
                                        onClick={() => navigate(`/exercise/${ex.id}`)}
                                        action={
                                            <Button
                                                size="icon"
                                                variant="accent"
                                                className="size-11 shrink-0 rounded-full"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    const last = getLastPerformance(ex.id)
                                                    const weight = last?.weight ?? 0
                                                    const reps = last?.reps ?? 1
                                                    setDrawerState({
                                                        exercise: ex,
                                                        weight,
                                                        reps,
                                                    })
                                                }}
                                            >
                                                <Plus className="size-5" />
                                            </Button>
                                        }
                                    />
                                </li>
                                )
                            })}
                        </ul>
                        {filteredExercises.length === 0 && bodyPartFilter !== 'all' && (
                            <p className="py-8 text-center text-muted-foreground">
                                {UI.noExerciseInGroup}
                            </p>
                        )}

                        <Drawer
                            open={!!drawerState}
                            onOpenChange={(open) => !open && setDrawerState(null)}
                        >
                            <DrawerContent>
                                <div className="w-full p-4">
                                    <DrawerHeader>
                                        <DrawerTitle>{UI.newPerf}</DrawerTitle>
                                    </DrawerHeader>
                                    {drawerState && (
                                        <>
                                            <form
                                                key={drawerState.exercise.id}
                                                className="space-y-6 pt-4"
                                                onSubmit={(e) => {
                                                    e.preventDefault()
                                                    if (drawerState.weight >= 0 && drawerState.reps > 0) {
                                                        savePerformance(drawerState.exercise.id, drawerState.weight, drawerState.reps)
                                                        refresh()
                                                        setDrawerState(null)
                                                    }
                                                }}
                                            >
                                                <div className="flex flex-col items-center gap-6 w-full">
                                                    <HorizontalWheelPicker
                                                        className="w-full"
                                                        value={drawerState.weight}
                                                        onChange={(w) => setDrawerState((s) => (s ? { ...s, weight: w } : null))}
                                                        min={0}
                                                        max={500}
                                                        step={0.5}
                                                        label={UI.weight}
                                                        unit="kg"
                                                    />
                                                    <HorizontalWheelPicker
                                                        className="w-full"
                                                        value={drawerState.reps}
                                                        onChange={(r) => setDrawerState((s) => (s ? { ...s, reps: r } : null))}
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
                                                    disabled={drawerState.reps <= 0}
                                                >
                                                    {UI.save}
                                                </Button>
                                            </form>
                                        </>
                                    )}
                                </div>
                            </DrawerContent>
                        </Drawer>
                    </>
                )}
            </main>
        </div>
    )
}

export default HomePage
