import { BodyWeightLabel } from '@/components/BodyWeightLabel'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LeagueBadge } from '@/components/LeagueBadge'
import { getExerciseImageUrl } from '@/lib/exercisedb'
import type { LeagueInfo } from '@/lib/strength-standards'
import { UI, translateBodyPart, translateTarget } from '@/lib/translations'
import { Dumbbell, Trophy } from 'lucide-react'

export interface ExerciseCardExercise {
    id: string
    name: string
    bodyPart?: string
    target?: string
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
    /** Slot pour un bouton d'action (ex: Plus pour enregistrer une perf) */
    action?: React.ReactNode
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
    action,
    onClick,
    imageSize = 'md',
}: ExerciseCardProps) {
    const sizeClass = imageSizes[imageSize]

    return (
        <Card
            className={onClick ? 'relative transition-colors hover:bg-muted/50 gap-2 cursor-pointer' : 'gap-2'}
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
                {action}
            </CardHeader>
            <CardContent className="border-t pb-0">
                <div className="flex gap-4 text-sm">
                    <div className="flex flex-1 flex-col items-start gap-1 rounded-lg border bg-muted/30 p-3">
                        <span className="text-muted-foreground">{UI.last}</span>
                        {lastPerf ? (
                            <span className="flex items-center gap-1">
                                <span className="text-2xl font-bold italic text-primary">
                                    {lastPerf.weight === 0 ? (
                                        <BodyWeightLabel className="text-2xl font-bold italic text-primary" />
                                    ) : (
                                        `${lastPerf.weight} kg`
                                    )}
                                </span>
                                <span>× {lastPerf.reps} reps</span>
                            </span>
                        ) : (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </div>
                    <div className="flex flex-1 flex-col items-start gap-1 rounded-lg border-2 border-accent/30 bg-accent/5 p-3">
                        <span className="flex items-center gap-1.5 font-medium text-primary">
                            <Trophy className="size-4" />
                            {UI.record}
                        </span>
                        {personalBest ? (
                            <span className="flex items-center gap-1">
                                <span className="text-2xl font-bold italic text-primary">
                                    {personalBest.weight === 0 ? (
                                        <BodyWeightLabel className="text-2xl font-bold italic text-primary" />
                                    ) : (
                                        `${personalBest.weight} kg`
                                    )}
                                </span>
                                <span>× {personalBest.reps} reps</span>
                            </span>
                        ) : (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
