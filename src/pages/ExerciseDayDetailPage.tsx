import { AddPerfDrawer } from '@/components/AddPerfDrawer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useBack } from '@/hooks/use-back'
import { usePerformance } from '@/hooks/use-performance'
import { getTrackedExerciseById } from '@/lib/storage'
import { UI } from '@/lib/translations'
import type { PerformanceEntry } from '@/types'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

export function ExerciseDayDetailPage() {
    const { id, date } = useParams<{ id: string; date: string }>()
    const goBack = useBack()
    const exercise = id ? getTrackedExerciseById(id) : null
    const { entries, deletePerformance, updatePerformance, refresh } =
        usePerformance(id ?? null)
    const [editPerfEntry, setEditPerfEntry] = useState<PerformanceEntry | null>(null)

    const dayEntries = date
        ? entries.filter((e) => e.date === date)
        : []

    if (!exercise || !date) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">{UI.exerciseNotFound}</p>
                <Button onClick={goBack}>{UI.back}</Button>
            </div>
        )
    }

    const dateLabel = new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    })

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-black px-4 py-4">
                <div className="mx-auto flex max-w-2xl items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goBack}
                    >
                        <ArrowLeft className="size-5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h1 className="truncate text-lg font-semibold capitalize">
                            {exercise.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">{dateLabel}</p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 py-4">
                {dayEntries.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            {UI.noPerfForDay}
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <h2 className="font-semibold">{UI.performanceList}</h2>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {[...dayEntries].reverse().map((entry) => (
                                    <li
                                        key={entry.id}
                                        className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                                    >
                                        <span className="font-medium">
                                            {entry.weight === 0
                                                ? `${UI.bodyWeightAbbr} × ${entry.reps} reps`
                                                : `${entry.weight} kg × ${entry.reps} reps`}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditPerfEntry(entry)}
                                                aria-label={UI.modifyPerf}
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    if (confirm(UI.confirmDeletePerf)) {
                                                        deletePerformance(entry.id)
                                                        refresh()
                                                        if (dayEntries.length <= 1) {
                                                            goBack()
                                                        }
                                                    }
                                                }}
                                                aria-label={UI.deletePerf}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                <AddPerfDrawer
                    open={editPerfEntry !== null}
                    onOpenChange={(open) => !open && setEditPerfEntry(null)}
                    exercise={{
                        id: exercise.id,
                        name: exercise.name,
                        originalName: exercise.originalName,
                        equipment: exercise.equipment,
                        target: exercise.target,
                    }}
                    initialWeight={editPerfEntry?.weight ?? 0}
                    initialReps={editPerfEntry?.reps ?? 1}
                    entryId={editPerfEntry?.id}
                    onUpdate={(entryId, weight, reps) => {
                        updatePerformance(entryId, weight, reps)
                        refresh()
                        setEditPerfEntry(null)
                    }}
                />
            </main>
        </div>
    )
}
