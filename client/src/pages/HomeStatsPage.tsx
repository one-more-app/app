import logo from '@/assets/logo-white.png'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { HomeStatsPageSkeleton } from '@/components/skeletons'
import { useHomeData } from '@/hooks/use-home-data'
import { UI } from '@/lib/translations'
import { Calendar, Dumbbell, Plus, Trophy } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

function formatDate(d: string): string {
    return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

export default function HomeStatsPage() {
    const { exercises, hasLoaded } = useHomeData()

    const stats = useMemo(() => {
        const trackedCount = exercises.length
        const pbCount = exercises.filter((e) => !!e.personalBest).length

        const lastSession = exercises
            .map((e) => e.lastPerf)
            .filter((p): p is NonNullable<typeof p> => !!p)
            .reduce<NonNullable<(typeof exercises)[number]['lastPerf']> | null>(
                (best, curr) => {
                    if (!best) return curr
                    const bestTime = new Date(best.createdAt).getTime()
                    const currTime = new Date(curr.createdAt).getTime()
                    return currTime > bestTime ? curr : best
                },
                null
            )

        const bestPB = exercises.reduce<{
            name: string
            pb: NonNullable<(typeof exercises)[number]['personalBest']>
        } | null>((best, ex) => {
            if (!ex.personalBest) return best
            if (!best) {
                return { name: ex.name ?? ex.originalName ?? 'Exercice', pb: ex.personalBest }
            }

            const bestPB = best.pb
            const currPB = ex.personalBest
            const better =
                currPB.weight > bestPB.weight ||
                (currPB.weight === bestPB.weight && currPB.reps > bestPB.reps)

            return better
                ? { name: ex.name ?? ex.originalName ?? 'Exercice', pb: currPB }
                : best
        }, null)

        return {
            trackedCount,
            pbCount,
            lastSession,
            bestPB,
        }
    }, [exercises])

    if (!hasLoaded) {
        return (
            <div className="min-h-screen-app bg-background">
                <header className="sticky top-0 z-10 border-b border-white/10 bg-black p-4">
                    <div className="mx-auto flex max-w-2xl items-center justify-between">
                        <Skeleton className="h-8 w-28" />
                        <Skeleton className="h-8 w-32 rounded-lg" />
                    </div>
                </header>
                <main className="mx-auto max-w-2xl p-4">
                    <HomeStatsPageSkeleton />
                </main>
            </div>
        )
    }

    const lastSessionText = stats.lastSession ? formatDate(stats.lastSession.date) : null

    return (
        <div className="min-h-screen-app bg-background">
            <header className="sticky-top-safe z-10 border-b border-white/10 bg-black p-4">
                <div className="mx-auto flex max-w-2xl items-center justify-between">
                    <img src={logo} alt="One More" className="h-8" />
                    <Button variant="ghost" size="sm" asChild>
                        <Link to="/exercises">
                            <Plus className="mr-2 size-4" />
                            {UI.chooseExercises}
                        </Link>
                    </Button>
                </div>
            </header>

            <main className="mx-auto max-w-2xl space-y-4 p-4">
                {exercises.length === 0 ? (
                    <EmptyState
                        variant="plain"
                        className="py-20"
                        icon={Dumbbell}
                        iconClassName="text-accent"
                        title={UI.noTrackedExercises}
                        description={UI.noTrackedDescription}
                    >
                        <Button asChild>
                            <Link to="/exercises">
                                <Plus className="mr-2 size-4" />
                                {UI.chooseExercises}
                            </Link>
                        </Button>
                    </EmptyState>
                ) : (
                    <>
                        <div>
                            <h1 className="text-xl font-semibold">Accueil</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Tes stats du moment.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <Card className="shadow-none">
                                <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground">
                                        Exercices suivis
                                    </p>
                                    <p className="mt-1 text-3xl font-semibold">
                                        {stats.trackedCount}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="shadow-none">
                                <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground">Records perso</p>
                                    <p className="mt-1 text-3xl font-semibold">{stats.pbCount}</p>
                                </CardContent>
                            </Card>

                            <Card className="shadow-none">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                <span className="inline-flex items-center gap-1">
                                                    <Calendar className="size-3.5" />
                                                    Derniere session
                                                </span>
                                            </p>
                                            <p className="mt-1 text-sm font-medium">
                                                {lastSessionText ?? '-'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="size-5" />
                                    Meilleur record
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {stats.bestPB ? (
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{stats.bestPB.name}</p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {stats.bestPB.pb.weight} kg x {stats.bestPB.pb.reps} reps
                                            </p>
                                        </div>
                                        <Button asChild variant="secondary" size="sm">
                                            <Link to="/exercises">
                                                <Plus className="mr-2 size-4" />
                                                Gerer
                                            </Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Ajoute une performance pour voir ton meilleur record.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>
        </div>
    )
}

