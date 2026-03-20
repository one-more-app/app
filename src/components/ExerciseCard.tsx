import { AddPerfDrawer } from '@/components/AddPerfDrawer'
import { BodyWeightLabel } from '@/components/BodyWeightLabel'
import { LeagueBadge } from '@/components/LeagueBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getExerciseImageUrl } from '@/lib/exercisedb'
import { LEAGUE_1RM_STYLES } from '@/lib/league-colors'
import type { LeagueInfo } from '@/lib/strength-standards'
import { UI, translateBodyPart, translateTarget } from '@/lib/translations'
import { Dumbbell, Plus, Trophy } from 'lucide-react'
import { useState } from 'react'

export interface ExerciseCardExercise {
    id: string
    name: string
    originalName?: string
    bodyPart?: string
    target?: string
    equipment?: string
    gifUrl?: string
    isCustom?: boolean
}

export interface ExerciseCardPerf {
    weight: number
    reps: number
}

interface ExerciseCardProps {
    exercise: ExerciseCardExercise
    lastPerf?: ExerciseCardPerf | null
    personalBest?: ExerciseCardPerf | null
    /** Info ligue (calculée à partir du PB et du profil) */
    leagueInfo?: LeagueInfo | null
    /** Callback après sauvegarde d'une performance (ouvre le drawer puis sauvegarde) */
    onSavePerf: (weight: number, reps: number) => void
    /** Rendre la carte cliquable (ex: navigation vers la page détail) */
    onClick?: () => void
    /** Taille de l'image : 'sm' (12) ou 'md' (14) */
    imageSize?: 'sm' | 'md'
}

const imageSizes = { sm: 'size-12', md: 'size-14' } as const

export function ExerciseCard({
    exercise,
    lastPerf,
    personalBest,
    leagueInfo,
    onSavePerf,
    onClick,
    imageSize = 'md',
}: ExerciseCardProps) {
    const sizeClass = imageSizes[imageSize]
    const [drawerOpen, setDrawerOpen] = useState(false)
    const isLeagueRecord = !!leagueInfo
    const recordContainerClassName = isLeagueRecord
        ? `flex flex-1 flex-col items-start gap-1 rounded-lg p-3 ${LEAGUE_1RM_STYLES[leagueInfo.level]}`
        : 'flex flex-1 flex-col items-start gap-1 rounded-lg border border-accent/70 bg-accent/10 p-3 text-primary'

    return (
        <>
            <Card
                className={onClick ? 'relative gap-2 cursor-pointer' : 'gap-2'}
                onClick={onClick}
            >
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    {!exercise.isCustom && exercise.gifUrl ? (
                        <img
                            src={getExerciseImageUrl(exercise.gifUrl)}
                            alt=""
                            className={`${sizeClass} rounded-lg object-cover bg-muted`}
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                            }}
                        />
                    ) : (
                        <div className={`${sizeClass} flex items-center justify-center rounded-lg bg-muted`}>
                            <Dumbbell className="size-6 text-accent" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-base capitalize">
                            {exercise.name}
                        </CardTitle>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {(exercise.bodyPart || exercise.target) && (
                                <Badge variant="secondary">
                                    {(exercise.bodyPart && translateBodyPart(exercise.bodyPart)) ||
                                        (exercise.target && translateTarget(exercise.target)) ||
                                        exercise.bodyPart ||
                                        exercise.target}
                                </Badge>
                            )}
                            {leagueInfo && (
                                <LeagueBadge league={leagueInfo} compact />
                            )}
                        </div>
                    </div>
                    <Button
                        size="icon"
                        variant="default"
                        className="size-11 shrink-0 rounded-full"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setDrawerOpen(true)
                        }}
                        aria-label={UI.newPerf}
                    >
                        <Plus className="size-5" />
                    </Button>
                </CardHeader>
                <CardContent className="border-t pb-0">
                    <div className="flex gap-4 text-sm">
                        <div className="flex flex-1 flex-col items-start gap-1 rounded-lg border bg-muted/30 p-3">
                            <span className="text-muted-foreground">{UI.last}</span>
                            {lastPerf ? (
                                <span className="flex items-center gap-1">
                                    <span className="text-2xl font-bold text-primary">
                                        {lastPerf.weight === 0 ? (
                                            <BodyWeightLabel className="text-2xl font-bold italic text-primary" />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-bold italic text-primary">
                                                    {lastPerf.weight}
                                                </span>
                                                <span className="text-sm font-normal">kg</span>
                                            </div>
                                        )}
                                    </span>
                                    <span>× {lastPerf.reps} reps</span>
                                </span>
                            ) : (
                                <span className="text-muted-foreground">—</span>
                            )}
                        </div>
                        <div className={recordContainerClassName}>
                            <span
                                className={
                                    isLeagueRecord
                                        ? 'flex items-center gap-1.5 font-medium text-muted-foreground'
                                        : 'flex items-center gap-1.5 font-medium text-primary'
                                }
                            >
                                <Trophy className="size-4" />
                                {UI.record}
                            </span>
                            {personalBest ? (
                                <span className="flex items-center gap-1">
                                    <span className="text-2xl font-bold italic text-primary">
                                        {personalBest.weight === 0 ? (
                                            <BodyWeightLabel className="text-2xl font-bold italic text-primary" />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-bold italic text-primary">
                                                    {personalBest.weight}
                                                </span>
                                                <span
                                                    className={
                                                        isLeagueRecord
                                                            ? 'text-sm font-normal text-muted-foreground'
                                                            : 'text-sm font-normal'
                                                    }
                                                >
                                                    kg
                                                </span>
                                            </div>
                                        )}
                                    </span>
                                    <span className={isLeagueRecord ? 'text-muted-foreground' : undefined}>
                                        × {personalBest.reps} reps
                                    </span>
                                </span>
                            ) : (
                                <span className="text-muted-foreground">—</span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AddPerfDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                exercise={exercise}
                initialWeight={lastPerf?.weight ?? 0}
                initialReps={lastPerf?.reps ?? 1}
                onSave={onSavePerf}
            />
        </>
    )
}
