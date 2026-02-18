import { ExerciseCard } from '@/components/ExerciseCard'
import { LEAGUE_COLORS, LeagueBadge } from '@/components/LeagueBadge'
import { PerformanceChart } from '@/components/PerformanceChart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { usePerformance } from '@/hooks/use-performance'
import {
    getTrackedExerciseById,
    getUserProfile,
    removeTrackedExercise,
    updateTrackedExercise,
} from '@/lib/storage'
import { getAllTiers, getLeagueInfo, isBodyweightAdditiveExercise } from '@/lib/strength-standards'
import { UI } from '@/lib/translations'
import { ArrowLeft, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

export function ExerciseDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [exercise, setExercise] = useState(() =>
        id ? getTrackedExerciseById(id) : null
    )
    const [renameOpen, setRenameOpen] = useState(false)
    const [renameValue, setRenameValue] = useState('')

    useEffect(() => {
        setExercise(id ? getTrackedExerciseById(id) : null)
    }, [id])
    const { entries, lastPerf, personalBest } = usePerformance(id ?? null)
    const profile = getUserProfile()
    const leagueInfo =
        exercise && !exercise.isCustom && personalBest
            ? getLeagueInfo({
                weight: personalBest.weight,
                reps: personalBest.reps,
                bodyWeightKg: profile.weightKg,
                gender: profile.gender,
                exerciseName: exercise.originalName ?? exercise.name,
            })
            : null
    const allTiers =
        leagueInfo && exercise && !exercise.isCustom
            ? getAllTiers(profile.weightKg, profile.gender, exercise.originalName ?? exercise.name)
            : null
    const [showAllTiers, setShowAllTiers] = useState(false)

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
                <div className="mx-auto flex max-w-2xl items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/">
                            <ArrowLeft className="size-5" />
                        </Link>
                    </Button>
                    <h1 className="flex-1 truncate text-lg font-semibold capitalize">
                        {exercise.name}
                    </h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setRenameValue(exercise.name)
                            setRenameOpen(true)
                        }}
                        aria-label={UI.rename}
                    >
                        <Pencil className="size-4" />
                    </Button>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-4 space-y-4">
                <ExerciseCard
                    exercise={exercise}
                    lastPerf={lastPerf ?? undefined}
                    personalBest={personalBest ?? undefined}
                    leagueInfo={leagueInfo}
                    imageSize="sm"
                />

                {leagueInfo && (
                    <Card className="gap-0">
                        <CardHeader className="gap-0">
                            <h2 className="font-semibold m-0 p-0">{UI.league}</h2>
                        </CardHeader>
                        <CardContent className="flex flex-col pb-1">
                            <LeagueBadge league={leagueInfo} showNextTarget />
                            {exercise &&
                                isBodyweightAdditiveExercise(
                                    exercise.originalName ?? exercise.name
                                ) && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {UI.totalLoadHint}
                                    </p>
                                )}
                            {allTiers && allTiers.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full justify-between text-muted-foreground"
                                        onClick={() => setShowAllTiers((v) => !v)}
                                    >
                                        {UI.allTiers}
                                        {showAllTiers ? (
                                            <ChevronUp className="size-4" />
                                        ) : (
                                            <ChevronDown className="size-4" />
                                        )}
                                    </Button>
                                    {showAllTiers && (
                                        <ul className="mt-2 space-y-1.5">
                                            {allTiers.map((tier) => (
                                                <li
                                                    key={tier.level}
                                                    className="flex items-center justify-between gap-2 text-sm"
                                                >
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            LEAGUE_COLORS[tier.level] ?? 'bg-muted'
                                                        }
                                                    >
                                                        {tier.label}
                                                    </Badge>
                                                    <span className="text-muted-foreground">
                                                        {tier.weightMax != null
                                                            ? `${tier.weightMin.toFixed(1)} → ${tier.weightMax.toFixed(1)} kg`
                                                            : `≥ ${tier.weightMin.toFixed(1)} kg`}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

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

                <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{UI.renameExercise}</DialogTitle>
                        </DialogHeader>
                        <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            placeholder={UI.placeholderExerciseName}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    if (id && renameValue.trim()) {
                                        updateTrackedExercise(id, {
                                            name: renameValue.trim(),
                                        })
                                        setExercise((prev) =>
                                            prev
                                                ? {
                                                    ...prev,
                                                    name: renameValue.trim(),
                                                }
                                                : null
                                        )
                                        setRenameOpen(false)
                                    }
                                }
                            }}
                        />
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                variant="outline"
                                onClick={() => setRenameOpen(false)}
                            >
                                {UI.cancel}
                            </Button>
                            <Button
                                onClick={() => {
                                    if (id && renameValue.trim()) {
                                        updateTrackedExercise(id, {
                                            name: renameValue.trim(),
                                        })
                                        setExercise((prev) =>
                                            prev
                                                ? {
                                                    ...prev,
                                                    name: renameValue.trim(),
                                                }
                                                : null
                                        )
                                        setRenameOpen(false)
                                    }
                                }}
                                disabled={!renameValue.trim()}
                            >
                                {UI.save}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </main>
        </div>
    )
}
