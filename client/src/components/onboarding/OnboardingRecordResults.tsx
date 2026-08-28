import { ExerciseImage } from "@/components/ExerciseImage"
import { ExerciseRecordStat } from "@/components/ExercisePerfStats"
import { ExerciseTitle } from "@/components/ExerciseTitle"
import { RankBadge } from "@/components/RankBadge"
import { OnboardingReveal } from "@/components/onboarding/onboarding-motion"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardHeader,
} from "@/components/ui/card"
import { useAnimatedCounter } from "@/hooks/use-animated-counter"
import {
    hapticImpact,
    hapticImpactMedium,
    hapticNotificationSuccess,
    primeHaptics,
} from "@/lib/haptics"
import { LEAGUE_ACCENT, LEAGUE_ACCENT_CLASS } from "@/lib/league-colors"
import {
    onboardingExerciseGifUrl,
    type OnboardingStarterExercise,
} from "@/lib/onboarding-starter-exercises"
import {
    getNextRankId,
    getRankIndex,
    RANK_ORDER,
    type LeagueInfo,
    type RankId,
} from "@/lib/strength-standards"
import { UI } from "@/lib/translations"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

function OnboardingExerciseContextCard({
    exercise,
    weight,
    reps,
}: {
    exercise: OnboardingStarterExercise
    weight: number
    reps: number
}) {
    const perf = { weight, reps }
    return (
        <Card className="w-full px-3 py-3">
            <CardHeader className="flex min-w-0 flex-row items-center gap-3 p-0">
                <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <ExerciseImage
                        gifUrl={onboardingExerciseGifUrl(exercise.exerciseId)}
                        bodyPart={exercise.bodyPart}
                        target={exercise.target}
                        className="size-full"
                        imgClassName="size-full object-cover"
                        fallbackIconClassName="size-8 text-muted-foreground"
                    />
                </div>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-2">
                    <ExerciseTitle
                        as="h3"
                        lines={2}
                        className="font-one-more text-xs uppercase italic"
                    >
                        {exercise.name}
                    </ExerciseTitle>
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="h-5">
                            {exercise.subtitle}
                        </Badge>
                    </div>
                </div>
                <ExerciseRecordStat
                    personalBest={perf}
                    compact
                    className="shrink-0"
                />
            </CardHeader>
        </Card>
    )
}

function formatKg(value: number): string {
    return String(Math.round(value))
}

export function OnboardingRankReveal({
    league,
    exercise,
    weight,
    reps,
}: {
    league: LeagueInfo
    exercise: OnboardingStarterExercise
    weight: number
    reps: number
}) {
    const [landed, setLanded] = useState(false)
    const [detailsReady, setDetailsReady] = useState(false)
    const nextId = league.nextRankId ?? getNextRankId(league.rankId)
    const remainingKg =
        league.progressToNext < 1
            ? Math.max(0, league.weightToReach - league.oneRM)
            : 0
    const showNextTarget = remainingKg > 0 && nextId != null
    const progressFill = LEAGUE_ACCENT[league.tier]
    const accentClass = LEAGUE_ACCENT_CLASS[league.tier]
    const youAreParts = UI.onboardingRankYouAre.split("{rank}")
    const rankGapParts = showNextTarget
        ? UI.onboardingRankGap
            .replace("{kg}", formatKg(remainingKg))
            .split("{next}")
        : null
    const upcomingIds = RANK_ORDER.slice(
        getRankIndex(league.rankId) + 1,
        getRankIndex(league.rankId) + 4,
    )
    const percentile = useAnimatedCounter(
        0,
        league.percentileEstimate,
        landed,
    )

    useEffect(() => {
        primeHaptics()
    }, [])

    useEffect(() => {
        if (!landed || percentile < league.percentileEstimate) return
        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches
        const timer = window.setTimeout(
            () => setDetailsReady(true),
            reduced ? 0 : 240,
        )
        return () => window.clearTimeout(timer)
    }, [landed, percentile, league.percentileEstimate])

    return (
        <div className="flex flex-col items-center gap-5">
            <OnboardingReveal delayMs={40} className="w-full">
                <OnboardingExerciseContextCard
                    exercise={exercise}
                    weight={weight}
                    reps={reps}
                />
            </OnboardingReveal>

            <RankReel rankId={league.rankId} onLanded={() => setLanded(true)} />

            <Card
                className={cn(
                    "w-full px-5 py-6",
                    landed && "rank-copy-up",
                    !landed && "pointer-events-none opacity-0",
                )}
            >
                <div className="space-y-2 text-center">
                    <p className="font-one-more text-lg uppercase italic leading-tight text-foreground text-balance">
                        {youAreParts[0]}
                        <span className={cn("font-one-more uppercase italic", accentClass)}>
                            {league.label}
                        </span>
                        {youAreParts[1] ?? ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {UI.percentileDescription.replace("{p}", String(percentile))}
                    </p>
                </div>

                <div
                    className={cn(
                        "grid transition-[grid-template-rows] duration-500 ease-out motion-reduce:transition-none",
                        detailsReady ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                    aria-hidden={!detailsReady}
                >
                    <div className="min-h-0 overflow-hidden pt-6">
                        <div className="space-y-6">
                            {showNextTarget && nextId && rankGapParts ? (
                                <div
                                    className={cn(
                                        "space-y-3.5 text-center",
                                        detailsReady && "rank-copy-up",
                                    )}
                                >
                                    <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-foreground flex-wrap text-balance">
                                        {rankGapParts[0]}
                                        <RankBadge rankId={nextId} size="sm" />
                                        {rankGapParts[1] ?? ""}
                                    </p>
                                    <RankProgressBar
                                        active={detailsReady}
                                        progress={league.progressToNext}
                                        fill={progressFill}
                                    />
                                </div>
                            ) : null}

                            {upcomingIds.length > 0 ? (
                                <div
                                    className={cn(
                                        "space-y-3 text-center",
                                        detailsReady && "rank-copy-up",
                                    )}
                                    style={{
                                        animationDelay: showNextTarget ? "160ms" : undefined,
                                    }}
                                >
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {UI.onboardingRankUpcoming}
                                    </p>
                                    <div className="flex items-center justify-center gap-2">
                                        {upcomingIds.map((id, index) => (
                                            <div
                                                key={id}
                                                className={detailsReady ? "rank-copy-up" : undefined}
                                                style={{
                                                    animationDelay: `${(showNextTarget ? 220 : 60) + index * 90}ms`,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        opacity: Math.max(
                                                            0.28,
                                                            0.7 - index * 0.18,
                                                        ),
                                                    }}
                                                >
                                                    <RankBadge rankId={id} size="sm" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}

const REEL_ITEM_H = 44
const REEL_VISIBLE = 3
const REEL_CENTER = 1

function RankReel({
    rankId,
    onLanded,
}: {
    rankId: RankId
    onLanded: () => void
}) {
    const targetIndex = getRankIndex(rankId)
    const [index, setIndex] = useState(-1.4)
    const [landed, setLanded] = useState(false)
    const onLandedRef = useRef(onLanded)
    onLandedRef.current = onLanded

    useEffect(() => {
        primeHaptics()
        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches
        if (reduced) {
            setIndex(targetIndex)
            setLanded(true)
            void hapticImpactMedium()
            onLandedRef.current()
            return
        }

        const from = -1.4
        const duration = Math.min(2400, 780 + targetIndex * 140)
        const start = performance.now()
        let lastStep = -2
        let lastTickHapticAt = 0
        let frame = 0
        let successTimer = 0

        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration)
            const eased = 1 - (1 - t) ** 4
            const pos = from + (targetIndex - from) * eased
            const step = Math.round(pos)
            if (step !== lastStep && step >= 0) {
                lastStep = step
                // Tick à chaque cran, sauf l'arrivée (impact medium + succès juste après).
                if (
                    step !== targetIndex &&
                    now - lastTickHapticAt >= 48
                ) {
                    lastTickHapticAt = now
                    void hapticImpact()
                }
            }
            setIndex(pos)
            if (t < 1) {
                frame = requestAnimationFrame(tick)
                return
            }
            setIndex(targetIndex)
            setLanded(true)
            void hapticImpactMedium()
            successTimer = window.setTimeout(() => {
                void hapticNotificationSuccess()
            }, 120)
            onLandedRef.current()
        }

        frame = requestAnimationFrame(tick)
        return () => {
            cancelAnimationFrame(frame)
            window.clearTimeout(successTimer)
        }
    }, [targetIndex])

    const offsetY = REEL_CENTER * REEL_ITEM_H - index * REEL_ITEM_H

    return (
        <div
            className="relative w-full overflow-hidden"
            style={{ height: REEL_VISIBLE * REEL_ITEM_H }}
            aria-hidden={!landed}
        >
            <div
                className="pointer-events-none absolute inset-x-0 top-0 z-10 h-7 bg-gradient-to-b from-background to-transparent"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-7 bg-gradient-to-t from-background to-transparent"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-x-8 top-1/2 z-0 h-11 -translate-y-1/2 rounded-xl bg-card/70"
                aria-hidden
            />
            <div
                className="relative z-[1] will-change-transform"
                style={{ transform: `translate3d(0, ${offsetY}px, 0)` }}
            >
                {RANK_ORDER.map((id, i) => {
                    const distance = Math.abs(index - i)
                    const isCenter = distance < 0.5
                    const opacity = Math.max(0.18, 1 - distance * 0.38)
                    const scale = isCenter ? 1 : Math.max(0.78, 1 - distance * 0.12)
                    return (
                        <div
                            key={id}
                            className="flex items-center justify-center"
                            style={{ height: REEL_ITEM_H }}
                        >
                            <div
                                className={cn(landed && isCenter && "rank-reel-lock")}
                                style={{
                                    opacity,
                                    transform: landed && isCenter ? undefined : `scale(${scale})`,
                                }}
                            >
                                <RankBadge
                                    rankId={id}
                                    size={isCenter ? "lg" : "md"}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function RankProgressBar({
    progress,
    fill,
    active = true,
}: {
    progress: number
    fill: string
    active?: boolean
}) {
    const [width, setWidth] = useState(0)

    useEffect(() => {
        if (!active) {
            setWidth(0)
            return
        }
        const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches
        const target = Math.min(100, Math.max(0, progress * 100))
        if (reduced) {
            setWidth(target)
            return
        }
        setWidth(0)
        const timeout = window.setTimeout(() => setWidth(target), 80)
        return () => clearTimeout(timeout)
    }, [active, progress])

    return (
        <div
            className="h-1.5 overflow-hidden rounded-full bg-background"
            aria-hidden
        >
            <div
                className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
                style={{ width: `${width}%`, backgroundColor: fill }}
            />
        </div>
    )
}
