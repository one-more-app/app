import { streakXpBonusPercent } from '@one-more/shared/streak-xp-multiplier'
import { RankBadge } from '@/components/RankBadge'
import { formatPerfBadge, leagueIconDropShadow } from '@/components/celebration-modal-ui'
import {
    levelCelebrationRadialBackground,
    leagueCelebrationRadialBackground,
    recordCelebrationGlow,
    shareCardThemeVars,
    streakCelebrationRadialBackground,
} from '@/lib/celebration-visual'
import type { CelebrationItem } from '@/lib/celebration-queue'
import { resolvePublicAssetUrl } from '@/lib/exercise-share-media'
import { LEAGUE_COLORS, leagueMapFill } from '@/lib/league-colors'
import { UI } from '@/lib/translations'
import { cn } from '@/lib/utils'
import { ArrowRight, Flame, Sparkles, Trophy, type LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

export type CelebrationShareOpen = CelebrationItem

/** Largeur export — assez pour les stories, plus rapide qu’en 1080px. */
export const CELEBRATION_SHARE_WIDTH = 720

const dropAccent =
    'drop-shadow(0 10px 28px color-mix(in srgb, var(--accent) 50%, transparent))'
const dropOrange =
    'drop-shadow(0 10px 28px color-mix(in srgb, #f97316 50%, transparent))'
const logoLockupShadow =
    'drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)]'

function ShareCardLogo() {
    const logoSrc = resolvePublicAssetUrl('logo-white-text.png')
    return (
        <img
            src={logoSrc}
            alt="One More"
            width={200}
            height={56}
            crossOrigin="anonymous"
            decoding="async"
            className={cn('h-9 w-auto max-w-[70%] object-contain opacity-95', logoLockupShadow)}
        />
    )
}

function ShareCardShell({
    background,
    isDark,
    children,
}: {
    background: string
    isDark: boolean
    children: ReactNode
}) {
    return (
        <div
            data-share-card-root
            className="inline-block antialiased"
            style={{
                ...shareCardThemeVars(isDark),
                width: CELEBRATION_SHARE_WIDTH,
                minWidth: CELEBRATION_SHARE_WIDTH,
            }}
        >
            <div
                className="relative overflow-hidden rounded-2xl border-2 border-border bg-card text-card-foreground"
                style={{ width: CELEBRATION_SHARE_WIDTH }}
            >
                <div
                    aria-hidden
                    className={`pointer-events-none absolute inset-0 ${isDark ? 'opacity-100' : 'opacity-95'}`}
                    style={{ background }}
                />
                <div className="relative z-[1] flex flex-col items-center gap-6 px-10 py-10 text-center">
                    {children}
                    <ShareCardLogo />
                </div>
            </div>
        </div>
    )
}

function ShareHero({
    icon: Icon,
    iconClassName,
    iconStyle,
    badge,
    badgeClassName,
}: {
    icon: LucideIcon
    iconClassName?: string
    iconStyle?: CSSProperties
    badge: ReactNode
    badgeClassName?: string
}) {
    return (
        <div className="relative inline-flex">
            <Icon
                className={cn('size-24 shrink-0', iconClassName)}
                style={iconStyle}
                strokeWidth={1.5}
                aria-hidden
            />
            <span
                className={cn(
                    'absolute -bottom-1 left-1/2 flex max-w-[14rem] -translate-x-1/2 items-center justify-center rounded-full px-4 py-1 font-one-more text-2xl font-bold italic tabular-nums shadow-lg ring-4 ring-card',
                    badgeClassName,
                )}
            >
                {badge}
            </span>
        </div>
    )
}

function ShareLeagueCard({
    open,
    isDark,
}: {
    open: Extract<CelebrationShareOpen, { kind: 'league' }>
    isDark: boolean
}) {
    const { exerciseName, prevLeague, nextLeague, weight, reps } = open.payload
    const glow = leagueMapFill(nextLeague.tier, isDark)
    const perfLabel = UI.leaguePromotionCelebrationPerf
        .replace('{weight}', String(weight))
        .replace('{reps}', String(reps))

    return (
        <ShareCardShell
            isDark={isDark}
            background={leagueCelebrationRadialBackground(glow)}
        >
            <ShareHero
                icon={Trophy}
                iconStyle={{ color: glow, filter: leagueIconDropShadow(glow) }}
                badge={
                    <RankBadge
                        league={nextLeague}
                        size="md"
                        variant={isDark ? 'dark' : 'light'}
                    />
                }
                badgeClassName="!bg-transparent !p-0 !shadow-none !ring-0 !font-sans !not-italic"
            />
            <div className="space-y-2">
                <h2 className="text-balance text-3xl font-semibold tracking-tight">
                    {UI.leaguePromotionCelebrationTitle}
                </h2>
                <p className="text-xl capitalize text-foreground/90">{exerciseName}</p>
            </div>
            {!prevLeague ? (
                <p className="text-lg font-medium" style={{ color: glow }}>
                    {UI.leaguePromotionCelebrationFirst}
                </p>
            ) : (
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <RankBadge
                        league={prevLeague}
                        size="md"
                        variant={isDark ? 'dark' : 'light'}
                        className="opacity-80"
                    />
                    <ArrowRight
                        className="size-6 shrink-0"
                        style={{ color: glow }}
                        aria-hidden
                    />
                    <RankBadge
                        league={nextLeague}
                        size="md"
                        variant={isDark ? 'dark' : 'light'}
                    />
                </div>
            )}
            <p className="text-lg text-muted-foreground">{perfLabel}</p>
        </ShareCardShell>
    )
}

function ShareRecordCard({
    open,
    isDark,
}: {
    open: Extract<CelebrationShareOpen, { kind: 'record' }>
    isDark: boolean
}) {
    const { exerciseName, weight, reps, leagueAfter } = open.payload
    const glow = recordCelebrationGlow(leagueAfter, isDark)
    const perfLabel = UI.leaguePromotionCelebrationPerf
        .replace('{weight}', String(weight))
        .replace('{reps}', String(reps))

    return (
        <ShareCardShell
            isDark={isDark}
            background={leagueCelebrationRadialBackground(glow)}
        >
            <ShareHero
                icon={Trophy}
                iconStyle={{ color: glow, filter: leagueIconDropShadow(glow) }}
                badge={formatPerfBadge(weight, reps)}
                badgeClassName={
                    leagueAfter
                        ? LEAGUE_COLORS[leagueAfter.tier]
                        : 'bg-primary text-primary-foreground'
                }
            />
            <div className="space-y-2">
                <h2 className="text-balance text-3xl font-semibold tracking-tight">
                    {UI.newRecordCelebrationTitle}
                </h2>
                <p className="text-xl capitalize text-foreground/90">{exerciseName}</p>
            </div>
            <p className="text-lg text-muted-foreground">{perfLabel}</p>
            {leagueAfter ? (
                <RankBadge
                    league={leagueAfter}
                    size="md"
                    variant={isDark ? 'dark' : 'light'}
                />
            ) : null}
        </ShareCardShell>
    )
}

function ShareStreakCard({
    open,
    isDark,
}: {
    open: Extract<CelebrationShareOpen, { kind: 'streak' }>
    isDark: boolean
}) {
    const { current } = open.payload
    const bonusPercent = streakXpBonusPercent(current)
    const title =
        current === 1
            ? UI.streakSheetTitleFirstDay
            : UI.streakSheetTitleStreak.replace('{days}', String(current))
    const description =
        current === 1
            ? UI.streakSheetSubtitleFirstDay
            : UI.streakSheetSubtitleStreak

    return (
        <ShareCardShell
            isDark={isDark}
            background={streakCelebrationRadialBackground()}
        >
            <ShareHero
                icon={Flame}
                iconClassName="text-orange-500"
                iconStyle={{ filter: dropOrange }}
                badge={current}
                badgeClassName="bg-orange-500 text-white"
            />
            <div className="space-y-2">
                <h2 className="text-balance text-3xl font-semibold tracking-tight">
                    {title}
                </h2>
                <p className="text-lg text-foreground/90">{description}</p>
                {bonusPercent > 0 ? (
                    <p className="text-xl font-extrabold tabular-nums text-orange-400">
                        {UI.streakXpBonusLabel.replace(
                            '{percent}',
                            String(bonusPercent),
                        )}
                    </p>
                ) : null}
            </div>
        </ShareCardShell>
    )
}

function ShareLevelUpCard({
    open,
    isDark,
}: {
    open: Extract<CelebrationShareOpen, { kind: 'levelup' }>
    isDark: boolean
}) {
    const { previousLevel, level, totalXp } = open.payload
    const leveledMultiple = level - previousLevel > 1

    return (
        <ShareCardShell
            isDark={isDark}
            background={levelCelebrationRadialBackground()}
        >
            <ShareHero
                icon={Sparkles}
                iconClassName="text-accent"
                iconStyle={{ filter: dropAccent }}
                badge={level}
                badgeClassName="bg-accent text-accent-foreground"
            />
            <div className="space-y-2">
                <h2 className="text-balance text-3xl font-semibold tracking-tight">
                    {UI.levelUpCelebrationTitle}
                </h2>
                <p className="text-lg text-foreground/90">
                    {UI.levelUpCelebrationSubtitle.replace(
                        '{level}',
                        String(level),
                    )}
                </p>
            </div>
            {leveledMultiple ? (
                <p className="flex items-center gap-2 text-lg text-muted-foreground">
                    <span>
                        {UI.xpLevelLabel.replace(
                            '{level}',
                            String(previousLevel),
                        )}
                    </span>
                    <ArrowRight className="size-5 shrink-0 text-accent" aria-hidden />
                    <span className="font-semibold text-foreground">
                        {UI.xpLevelLabel.replace('{level}', String(level))}
                    </span>
                </p>
            ) : null}
            <p className="text-lg text-muted-foreground">
                {UI.xpTotalLabel.replace('{xp}', String(totalXp))}
            </p>
        </ShareCardShell>
    )
}

export function CelebrationShareCard({
    open,
    isDark,
}: {
    open: CelebrationShareOpen
    isDark: boolean
}) {
    switch (open.kind) {
        case 'league':
            return <ShareLeagueCard open={open} isDark={isDark} />
        case 'record':
            return <ShareRecordCard open={open} isDark={isDark} />
        case 'streak':
            return <ShareStreakCard open={open} isDark={isDark} />
        case 'levelup':
            return <ShareLevelUpCard open={open} isDark={isDark} />
        default:
            return null
    }
}
