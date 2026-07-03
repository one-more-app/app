import { AddPerfDrawer } from '@/components/AddPerfDrawer'
import { ExerciseTitle } from '@/components/ExerciseTitle'
import { BodyWeightLabel } from '@/components/BodyWeightLabel'
import { LeagueBadge } from '@/components/LeagueBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ExerciseImage } from '@/components/ExerciseImage'
import { hapticImpact, hapticImpactMedium } from '@/lib/haptics'
import { LEAGUE_1RM_STYLES } from '@/lib/league-colors'
import type { LeagueInfo } from '@/lib/strength-standards'
import { UI, translateBodyPart, translateTarget } from '@/lib/translations'
import { cn } from '@/lib/utils'
import { Plus, Trophy } from 'lucide-react'
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
    /** Accueil : masque dernier record / record max, garde en-tête + tags + plus */
    compact?: boolean
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
    compact = false,
}: ExerciseCardProps) {
    const sizeClass = imageSizes[imageSize]
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
    const isLeagueRecord = !!leagueInfo
    const recordContainerClassName = isLeagueRecord
        ? `flex flex-1 flex-col items-start gap-1 rounded-lg p-3 ${LEAGUE_1RM_STYLES[leagueInfo!.tier]}`
        : 'flex flex-1 flex-col items-start gap-1 rounded-lg border border-accent/70 bg-accent/10 p-3 text-foreground'

    return (
        <>
            <Card
                className={
                    onClick
                        ? 'relative cursor-pointer px-3 py-3'
                        : undefined
                }
                onClick={
                    onClick
                        ? () => {
                            void hapticImpact()
                            onClick()
                        }
                        : undefined
                }
            >
                <CardHeader
                    className={cn(
                        'flex min-w-0 flex-row items-stretch gap-4',
                        compact ? 'p-0' : 'pb-4',
                    )}
                >
                    {!exercise.isCustom && exercise.gifUrl ? (
                        <button
                            type="button"
                            className={`${sizeClass} shrink-0 self-center overflow-hidden rounded-lg bg-muted`}
                            aria-label={exercise.name}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                void hapticImpact()
                                setImagePreviewOpen(true)
                            }}
                        >
                            <ExerciseImage
                                gifUrl={exercise.gifUrl}
                                bodyPart={exercise.bodyPart}
                                target={exercise.target}
                                className="size-full"
                                imgClassName="size-full object-cover"
                                fallbackIconClassName="size-7 text-muted-foreground"
                            />
                        </button>
                    ) : (
                        <div className={`${sizeClass} shrink-0 self-center overflow-hidden rounded-lg bg-muted`}>
                            <ExerciseImage
                                gifUrl={exercise.gifUrl}
                                isCustom={exercise.isCustom}
                                bodyPart={exercise.bodyPart}
                                target={exercise.target}
                                className="size-full"
                                fallbackIconClassName="size-7 text-muted-foreground"
                            />
                        </div>
                    )}
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-2 self-stretch">
                        <ExerciseTitle
                            as="h3"
                            className="font-one-more text-xs uppercase italic"
                        >
                            {exercise.name}
                        </ExerciseTitle>
                        <div className="flex flex-wrap items-center gap-1.5">
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
                        className="size-11 shrink-0 self-center rounded-full"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            void hapticImpactMedium()
                            setDrawerOpen(true)
                        }}
                        haptic={false}
                        aria-label={UI.newPerf}
                    >
                        <Plus className="size-5" />
                    </Button>
                </CardHeader>
                {!compact ? (
                    <CardContent className="border-t pb-0">
                        <div className="flex gap-4 text-sm">
                            <div className="flex flex-1 flex-col items-start gap-1 rounded-lg border bg-muted/30 p-3">
                                <span className="text-muted-foreground">{UI.last}</span>
                                {lastPerf ? (
                                    <span className="flex items-center gap-1">
                                        <span className="text-2xl font-bold text-foreground">
                                            {lastPerf.weight === 0 ? (
                                                <BodyWeightLabel className="text-2xl font-one-more font-bold italic text-foreground" />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-one-more text-2xl font-bold italic text-foreground">
                                                        {lastPerf.weight}
                                                    </span>
                                                    <span className="text-sm font-normal text-muted-foreground">kg</span>
                                                </div>
                                            )}
                                        </span>
                                        <span className="text-muted-foreground">× {lastPerf.reps}</span>
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">–</span>
                                )}
                            </div>
                            <div className={recordContainerClassName}>
                                <span
                                    className={
                                        isLeagueRecord
                                            ? 'flex items-center gap-1.5 font-medium text-muted-foreground'
                                            : 'flex items-center gap-1.5 font-medium text-foreground'
                                    }
                                >
                                    <Trophy className="size-4" />
                                    {UI.record}
                                </span>
                                {personalBest ? (
                                    <span className="flex items-center gap-1">
                                        <span className="text-2xl font-bold text-foreground">
                                            {personalBest.weight === 0 ? (
                                                <BodyWeightLabel className="font-one-more text-2xl font-bold italic text-foreground" />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-one-more text-2xl font-bold italic text-foreground">
                                                        {personalBest.weight}
                                                    </span>
                                                    <span className="text-sm font-normal text-muted-foreground">
                                                        kg
                                                    </span>
                                                </div>
                                            )}
                                        </span>
                                        <span className={isLeagueRecord ? 'text-muted-foreground' : undefined}>
                                            × {personalBest.reps}
                                        </span>
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">–</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                ) : null}
            </Card>

            <AddPerfDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                exercise={exercise}
                initialWeight={lastPerf?.weight ?? 0}
                initialReps={lastPerf?.reps ?? 1}
                onSave={onSavePerf}
            />

            {!exercise.isCustom && exercise.gifUrl ? (
                <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
                    <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 sm:max-w-lg">
                        <div className="bg-muted">
                            <ExerciseImage
                                gifUrl={exercise.gifUrl}
                                bodyPart={exercise.bodyPart}
                                target={exercise.target}
                                className="mx-auto max-h-[min(70vh,480px)] w-full"
                                imgClassName="mx-auto max-h-[min(70vh,480px)] w-full object-contain"
                                fallbackIconClassName="size-24 text-muted-foreground"
                                fit="contain"
                            />
                        </div>
                        <DialogHeader className="space-y-0 p-4 pt-3 text-left">
                            <DialogTitle className="truncate pr-8 text-left text-lg capitalize leading-snug">
                                {exercise.name}
                            </DialogTitle>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            ) : null}
        </>
    )
}
