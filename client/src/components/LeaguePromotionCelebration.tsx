import {
    CelebrationHeroMetric,
    CelebrationModalShell,
    formatPerfBadge,
    leagueIconDropShadow,
} from '@/components/celebration-modal-ui'
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
import type {
    LevelUpCelebrationPayload,
    StreakCelebrationPayload,
} from '@/lib/xp-notifications'
import { useCelebrationQueueSnapshot } from '@/hooks/use-celebration-queue-active'
import { useAnimatedCounter } from '@/hooks/use-animated-counter'
import {
    levelCelebrationRadialBackground,
    streakCelebrationRadialBackground,
} from '@/lib/celebration-visual'
import { UI } from '@/lib/translations'
import { ArrowRight, Flame, Share2, Sparkles, Trophy } from 'lucide-react'
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
    const perfLabel = UI.leaguePromotionCelebrationPerf
        .replace('{weight}', String(weight))
        .replace('{reps}', String(reps))

    return (
        <CelebrationModalShell
            background={leagueCelebrationRadialBackground(glow)}
            style={{ ['--league-celebration']: glow } as CSSProperties}
        >
            <CelebrationHeroMetric
                icon={Trophy}
                iconColor={glow}
                iconDropShadow={leagueIconDropShadow(glow)}
                badge={formatPerfBadge(weight, reps)}
                badgeClassName={
                    leagueAfter
                        ? LEAGUE_COLORS[leagueAfter.level]
                        : 'bg-primary text-primary-foreground'
                }
                ariaLabel={`${UI.newRecordCelebrationTitle} — ${perfLabel}`}
            />
            <DialogHeader className="flex w-full flex-col items-center gap-2 space-y-0 text-center sm:text-center">
                <DialogTitle className="text-balance text-xl font-semibold tracking-tight">
                    {UI.newRecordCelebrationTitle}
                </DialogTitle>
                <DialogDescription asChild>
                    <p className="text-base text-foreground/90 capitalize">
                        {exerciseName}
                    </p>
                </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{perfLabel}</p>
            {leagueAfter ? (
                <Badge
                    variant="outline"
                    className={`px-2.5 py-0.5 text-xs font-semibold ${LEAGUE_COLORS[leagueAfter.level]}`}
                >
                    {leagueAfter.label}
                </Badge>
            ) : null}
        </CelebrationModalShell>
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
    const perfLabel = UI.leaguePromotionCelebrationPerf
        .replace('{weight}', String(weight))
        .replace('{reps}', String(reps))

    return (
        <CelebrationModalShell
            background={leagueCelebrationRadialBackground(leagueGlow)}
            style={{ ['--league-celebration']: leagueGlow } as CSSProperties}
        >
            <CelebrationHeroMetric
                icon={Trophy}
                iconColor={leagueGlow}
                iconDropShadow={leagueIconDropShadow(leagueGlow)}
                badge={
                    <span className="truncate">{nextLeague.label}</span>
                }
                badgeClassName={LEAGUE_COLORS[nextLeague.level]}
                ariaLabel={`${UI.leaguePromotionCelebrationTitle} — ${nextLeague.label}`}
            />
            <DialogHeader className="flex w-full flex-col items-center gap-2 space-y-0 text-center sm:text-center">
                <DialogTitle className="text-balance text-xl font-semibold tracking-tight">
                    {UI.leaguePromotionCelebrationTitle}
                </DialogTitle>
                <DialogDescription asChild>
                    <p className="text-base text-foreground/90 capitalize">
                        {exerciseName}
                    </p>
                </DialogDescription>
            </DialogHeader>
            {!prevLeague ? (
                <p
                    className="text-sm font-medium"
                    style={{ color: leagueGlow }}
                >
                    {UI.leaguePromotionCelebrationFirst}
                </p>
            ) : (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <Badge
                        variant="outline"
                        className={`px-2 py-0.5 text-xs ${LEAGUE_COLORS[prevLeague.level]}`}
                    >
                        {prevLeague.label}
                    </Badge>
                    <ArrowRight
                        className="size-4 shrink-0"
                        style={{ color: leagueGlow }}
                        aria-hidden
                    />
                    <Badge
                        variant="outline"
                        className={`px-2 py-0.5 text-xs font-semibold ${LEAGUE_COLORS[nextLeague.level]}`}
                    >
                        {nextLeague.label}
                    </Badge>
                </div>
            )}
            <p className="text-sm text-muted-foreground">{perfLabel}</p>
        </CelebrationModalShell>
    )
}

function LevelUpCelebrationContent({
    payload,
}: {
    payload: LevelUpCelebrationPayload
}) {
    const { previousLevel, level, totalXp } = payload
    const displayLevel = useAnimatedCounter(previousLevel, level, true)
    const leveledMultiple = level - previousLevel > 1

    return (
        <div className="relative min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-95 dark:opacity-100"
                style={{
                    background: levelCelebrationRadialBackground(),
                }}
            />
            <div className="relative z-[1] flex flex-col items-center gap-4 px-6 pb-4 pt-14 text-center">
                <div
                    className="celebration-hero-anim relative inline-flex"
                    aria-label={UI.levelUpCelebrationSubtitle.replace(
                        '{level}',
                        String(level),
                    )}
                >
                    <Sparkles
                        className="size-16 text-accent [filter:drop-shadow(0_8px_24px_color-mix(in_srgb,var(--accent)_55%,transparent))]"
                        strokeWidth={1.5}
                        aria-hidden
                    />
                    <span
                        key={displayLevel}
                        className="celebration-count-anim absolute -bottom-0.5 left-1/2 flex min-w-9 -translate-x-1/2 items-center justify-center rounded-full bg-accent px-2.5 py-0.5 font-one-more text-base font-bold italic tabular-nums text-accent-foreground shadow-md ring-2 ring-background"
                        aria-hidden
                    >
                        {displayLevel}
                    </span>
                </div>
                <DialogHeader className="flex w-full flex-col items-center gap-2 space-y-0 text-center sm:text-center">
                    <DialogTitle className="text-balance text-xl font-semibold tracking-tight">
                        {UI.levelUpCelebrationTitle}
                    </DialogTitle>
                    <DialogDescription className="text-base text-foreground/90">
                        {UI.levelUpCelebrationSubtitle.replace(
                            '{level}',
                            String(level),
                        )}
                    </DialogDescription>
                </DialogHeader>
                {leveledMultiple ? (
                    <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                        <span>
                            {UI.xpLevelLabel.replace(
                                '{level}',
                                String(previousLevel),
                            )}
                        </span>
                        <ArrowRight
                            className="size-4 shrink-0 text-accent"
                            aria-hidden
                        />
                        <span className="font-semibold text-foreground">
                            {UI.xpLevelLabel.replace('{level}', String(level))}
                        </span>
                    </p>
                ) : null}
                <p className="text-sm text-muted-foreground">
                    {UI.xpTotalLabel.replace('{xp}', String(totalXp))}
                </p>
            </div>
        </div>
    )
}

function StreakCelebrationContent({ payload }: { payload: StreakCelebrationPayload }) {
    const { current, previousStreak, xpGained, level } = payload
    const displayCount = useAnimatedCounter(previousStreak, current, true)

    const title =
        current === 1
            ? UI.streakSheetTitleFirstDay
            : UI.streakSheetTitleStreak.replace('{days}', String(current))

    const description =
        current === 1
            ? UI.streakSheetSubtitleFirstDay
            : UI.streakSheetSubtitleStreak

    return (
        <div className="relative min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-95 dark:opacity-100"
                style={{
                    background: streakCelebrationRadialBackground(),
                }}
            />
            <div className="relative z-[1] flex flex-col items-center gap-4 px-6 pb-4 pt-14 text-center">
                <div
                    className="celebration-hero-anim relative inline-flex"
                    aria-label={title}
                >
                    <Flame
                        className="size-16 text-orange-500 [filter:drop-shadow(0_8px_24px_color-mix(in_srgb,#f97316_55%,transparent))]"
                        strokeWidth={1.5}
                        aria-hidden
                    />
                    <span
                        key={displayCount}
                        className="celebration-count-anim absolute -bottom-0.5 left-1/2 flex min-w-8 -translate-x-1/2 items-center justify-center rounded-full bg-orange-500 px-2 py-0.5 text-sm font-bold tabular-nums text-white shadow-md ring-2 ring-background"
                        aria-hidden
                    >
                        {displayCount}
                    </span>
                </div>
                <DialogHeader className="flex w-full flex-col items-center gap-2 space-y-0 text-center sm:text-center">
                    <DialogTitle className="text-balance text-xl font-semibold tracking-tight">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-base text-foreground/90">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                {xpGained != null && xpGained > 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {UI.xpGainedToast.replace('{amount}', String(xpGained))}
                        {' · '}
                        {UI.xpLevelLabel.replace('{level}', String(level))}
                    </p>
                ) : null}
            </div>
        </div>
    )
}

export function LeaguePromotionCelebrationHost() {
    const { resolvedTheme } = useTheme()
    const { current: open } = useCelebrationQueueSnapshot()
    const [shareBusy, setShareBusy] = useState(false)

    const dismiss = () => advanceCelebrationQueue()

    useEffect(() => {
        if (!open) setShareBusy(false)
    }, [open])

    const isDark = resolvedTheme === 'dark'

    const handleShare = async () => {
        if (!open || shareBusy) return
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
                ) : open?.kind === 'streak' ? (
                    <div className="flex min-h-0 flex-1 flex-col">
                        <StreakCelebrationContent
                            key={`${open.payload.current}-${open.payload.previousStreak}`}
                            payload={open.payload}
                        />
                    </div>
                ) : open?.kind === 'levelup' ? (
                    <div className="flex min-h-0 flex-1 flex-col">
                        <LevelUpCelebrationContent
                            key={`${open.payload.previousLevel}-${open.payload.level}`}
                            payload={open.payload}
                        />
                    </div>
                ) : null}
                <DialogFooter className="mt-0 flex w-full shrink-0 flex-col gap-3 border-t border-border bg-card/95 px-4 py-4 backdrop-blur-sm sm:flex-row sm:justify-center">
                    <Button
                        className="w-full min-w-[12rem] sm:w-auto"
                        size="lg"
                        variant="secondary"
                        disabled={!open || shareBusy}
                        onClick={handleShare}
                    >
                        <Share2 className="mr-2 size-4" aria-hidden />
                        {shareBusy ? UI.sharePreparing : UI.share}
                    </Button>
                    <Button
                        className="w-full min-w-[12rem] sm:w-auto"
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
