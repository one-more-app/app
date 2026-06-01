import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { useTheme } from '@/hooks/use-theme'
import { shareCelebrationPng } from '@/lib/celebration-share'
import {
    leagueCelebrationRadialBackground,
    recordCelebrationGlow,
} from '@/lib/celebration-visual'
import { LEAGUE_COLORS, leagueMapFill } from '@/lib/league-colors'
import { advanceCelebrationQueue } from '@/lib/celebration-queue'
import type {
    LeaguePromotionPayload,
    NewRecordCelebrationPayload,
} from '@/lib/perf-notifications'
import type { LevelUpCelebrationPayload } from '@/lib/xp-notifications'
import { useCelebrationQueueSnapshot } from '@/hooks/use-celebration-queue-active'
import { UI } from '@/lib/translations'
import { ArrowRight, Share2, Trophy } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { toast } from 'sonner'

function NewRecordCelebrationContent({
    payload,
    isDark,
}: {
    payload: NewRecordCelebrationPayload
    isDark: boolean
}) {
    const { exerciseName, weight, reps, leagueAfter } = payload
    const glow = recordCelebrationGlow(leagueAfter, isDark)

    return (
        <div
            className="relative min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto"
            style={{ ['--league-celebration']: glow } as CSSProperties}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-95 dark:opacity-100"
                style={{
                    background: leagueCelebrationRadialBackground(glow),
                }}
            />
            <div className="relative z-[1] flex flex-col items-center gap-5 px-6 pb-4 pt-14 text-center">
                <div className="league-promo-trophy-anim">
                    <Trophy
                        className="text-white mx-auto size-14 [filter:drop-shadow(0_6px_20px_color-mix(in_srgb,var(--league-celebration)_58%,transparent))]"
                        strokeWidth={1.75}
                        aria-hidden
                    />
                </div>
                <DialogHeader className="flex w-full flex-col items-center gap-3 space-y-0 text-center sm:text-center">
                    <DialogTitle className="text-balance text-xl font-semibold tracking-tight">
                        {UI.newRecordCelebrationTitle}
                    </DialogTitle>
                    <DialogDescription asChild>
                        <p className="text-base text-foreground/90 capitalize">
                            {exerciseName}
                        </p>
                    </DialogDescription>
                </DialogHeader>
                <p className="font-one-more text-lg font-bold italic text-primary">
                    {UI.leaguePromotionCelebrationPerf
                        .replace('{weight}', String(weight))
                        .replace('{reps}', String(reps))}
                </p>
                {leagueAfter ? (
                    <div
                        className="flex flex-col items-center gap-2"
                        style={
                            {
                                '--league-glow': glow,
                            } as CSSProperties
                        }
                    >
                        <div className="league-promo-ring-anim rounded-xl">
                            <Badge
                                variant="outline"
                                className={`px-3 py-1 text-sm ${LEAGUE_COLORS[leagueAfter.level]}`}
                            >
                                <Trophy
                                    className="mr-1 size-3"
                                    aria-hidden
                                    style={{ color: 'var(--league-celebration)' }}
                                />
                                {leagueAfter.label}
                            </Badge>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}

function LeaguePromotionContent({
    payload,
    isDark,
}: {
    payload: LeaguePromotionPayload
    isDark: boolean
}) {
    const { exerciseName, prevLeague, nextLeague, weight, reps } = payload
    const leagueGlow = leagueMapFill(nextLeague.level, isDark)

    return (
        <div
            className="relative min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto"
            style={{ ['--league-celebration']: leagueGlow } as CSSProperties}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-95 dark:opacity-100"
                style={{
                    background: leagueCelebrationRadialBackground(leagueGlow),
                }}
            />
            <div className="relative z-[1] flex flex-col items-center gap-5 px-6 pb-4 pt-14 text-center">
                <div className="league-promo-trophy-anim">
                    <Trophy
                        className="text-white mx-auto size-14 [filter:drop-shadow(0_6px_20px_color-mix(in_srgb,var(--league-celebration)_58%,transparent))]"
                        strokeWidth={1.75}
                        aria-hidden
                    />
                </div>
                <DialogHeader className="flex w-full flex-col items-center gap-3 space-y-0 text-center sm:text-center">
                    <DialogTitle className="text-balance text-xl font-semibold tracking-tight">
                        {UI.leaguePromotionCelebrationTitle}
                    </DialogTitle>
                    <DialogDescription asChild>
                        <p className="text-base text-foreground/90 capitalize">
                            {exerciseName}
                        </p>
                    </DialogDescription>
                </DialogHeader>
                <p className="font-one-more text-lg font-bold italic text-primary">
                    {UI.leaguePromotionCelebrationPerf
                        .replace('{weight}', String(weight))
                        .replace('{reps}', String(reps))}
                </p>
                {!prevLeague ? (
                    <div
                        className="flex flex-col items-center gap-3"
                        style={
                            {
                                '--league-glow': leagueGlow,
                            } as CSSProperties
                        }
                    >
                        <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--league-celebration)' }}
                        >
                            {UI.leaguePromotionCelebrationFirst}
                        </p>
                        <div
                            className="league-promo-ring-anim rounded-xl px-2 py-1"
                            style={
                                {
                                    '--league-glow': leagueGlow,
                                } as CSSProperties
                            }
                        >
                            <Badge
                                variant="outline"
                                className={`px-3 py-1 text-sm ${LEAGUE_COLORS[nextLeague.level]}`}
                            >
                                <Trophy
                                    className="mr-1 size-3"
                                    aria-hidden
                                    style={{ color: 'var(--league-celebration)' }}
                                />
                                {nextLeague.label}
                            </Badge>
                        </div>
                    </div>
                ) : (
                    <div className="flex w-full max-w-full flex-wrap items-center justify-center gap-2 sm:gap-3">
                        <Badge
                            variant="outline"
                            className={`shrink-0 px-2.5 py-1 text-xs whitespace-normal text-center ${LEAGUE_COLORS[prevLeague.level]}`}
                        >
                            {prevLeague.label}
                        </Badge>
                        <ArrowRight
                            className="league-promo-nudge-anim size-5 shrink-0"
                            aria-hidden
                            style={{ color: 'var(--league-celebration)' }}
                        />
                        <div
                            className="league-promo-ring-anim rounded-xl"
                            style={
                                {
                                    '--league-glow': leagueGlow,
                                } as CSSProperties
                            }
                        >
                            <Badge
                                variant="outline"
                                className={`shrink-0 px-2.5 py-1 text-xs whitespace-normal text-center ${LEAGUE_COLORS[nextLeague.level]}`}
                            >
                                <Trophy
                                    className="mr-1 size-3"
                                    aria-hidden
                                    style={{ color: 'var(--league-celebration)' }}
                                />
                                {nextLeague.label}
                            </Badge>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export function LeaguePromotionCelebrationHost() {
    const { resolvedTheme } = useTheme()
    const { current: open, total, pendingCount } = useCelebrationQueueSnapshot()
    const queuePosition =
        open && total > 1 ? total - pendingCount : 0
    const [shareBusy, setShareBusy] = useState(false)

    const dismiss = () => advanceCelebrationQueue()

    useEffect(() => {
        if (!open) setShareBusy(false)
    }, [open])

    const isDark = resolvedTheme === 'dark'

    const handleShare = async () => {
        if (!open || shareBusy || open.kind === 'levelup') return
        setShareBusy(true)
        try {
            const result = await shareCelebrationPng(open, isDark)
            if (result === 'downloaded') toast.success(UI.shareImageSaved)
        } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') return
            toast.error(UI.shareImageError)
        } finally {
            setShareBusy(false)
        }
    }

    return (
        <Dialog
            open={!!open}
            onOpenChange={(o) => {
                if (!o) dismiss()
            }}
        >
            <DialogContent
                showCloseButton
                className="flex flex-col gap-0 overflow-hidden border-2 border-border bg-card p-0 duration-300 sm:max-w-md sm:w-full"
            >
                {open?.kind === 'league' ? (
                    <div className="flex min-h-0 flex-1 flex-col">
                        <LeaguePromotionContent
                            payload={open.payload}
                            isDark={isDark}
                        />
                    </div>
                ) : open?.kind === 'record' ? (
                    <div className="flex min-h-0 flex-1 flex-col">
                        <NewRecordCelebrationContent
                            payload={open.payload}
                            isDark={isDark}
                        />
                    </div>
                ) : open?.kind === 'levelup' ? (
                    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 py-14 text-center">
                        <Trophy
                            className="mx-auto size-14 text-primary"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                        <DialogHeader className="space-y-2 text-center sm:text-center">
                            <DialogTitle className="text-xl font-semibold">
                                {UI.levelUpCelebrationTitle}
                            </DialogTitle>
                            <DialogDescription className="text-base text-foreground/90">
                                {UI.levelUpCelebrationSubtitle.replace(
                                    '{level}',
                                    String(open.payload.level),
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground">
                            {UI.xpTotalLabel.replace(
                                '{xp}',
                                String(open.payload.totalXp),
                            )}
                        </p>
                    </div>
                ) : null}
                <DialogFooter className="mt-0 flex w-full shrink-0 flex-col gap-4 border-t border-border bg-card/95 px-4 py-4 backdrop-blur-sm sm:flex-row sm:justify-center">
                    {queuePosition > 0 ? (
                        <p
                            className="w-full text-center text-xs text-muted-foreground sm:order-0 sm:basis-full"
                            aria-live="polite"
                        >
                            {UI.celebrationQueueProgress
                                .replace('{current}', String(queuePosition))
                                .replace('{total}', String(total))}
                        </p>
                    ) : null}
                    <Button
                        className="w-full min-w-[12rem] sm:w-auto sm:order-2"
                        size="lg"
                        variant="secondary"
                        disabled={!open || shareBusy || open?.kind === 'levelup'}
                        onClick={handleShare}
                    >
                        <Share2 className="mr-2 size-4" aria-hidden />
                        {shareBusy ? UI.sharePreparing : UI.share}
                    </Button>
                    <Button
                        className="w-full min-w-[12rem] sm:w-auto sm:order-1"
                        size="lg"
                        onClick={dismiss}
                    >
                        {UI.continue}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
