import { RankBadge } from '@/components/RankBadge'
import {
    shareCardThemeVars,
    shareStoryMeshBackground,
    shareStoryVignette,
} from '@/lib/celebration-visual'
import { resolvePublicAssetUrl } from '@/lib/exercise-share-media'
import { leagueMapFill } from '@/lib/league-colors'
import type { LeagueInfo } from '@/lib/strength-standards'
import { UI } from '@/lib/translations'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import Body, { type ExtendedBodyPart, type Slug } from 'react-muscle-highlighter'

export type SessionRecapShareVariant =
    | 'stats'
    | 'muscles'
    | 'records'
    | 'league'

export type SessionRecapShareMode = 'photo' | 'sticker'

export type SessionRecapShareMuscle = {
    slug: Slug
    label: string
    sets: number
}

export type SessionRecapShareRecord = {
    name: string
    weight: number
    reps: number
}

export type SessionRecapSharePayload = {
    /** Ex. « 6 oct ». */
    dateLabel: string
    volume: number
    durationLabel: string
    setCount: number
    recordCount: number
    /** Triés par nombre de séries décroissant. */
    muscles: SessionRecapShareMuscle[]
    /** Au plus 3, les plus lourds en premier. */
    records: SessionRecapShareRecord[]
    league: { exerciseName: string; league: LeagueInfo } | null
}

/** Export 9:16 optimisé stories. */
export const SESSION_RECAP_SHARE_WIDTH = 1080
export const SESSION_RECAP_SHARE_HEIGHT = 1920
/** Largeur du sticker transparent (le fond est laissé libre). */
export const SESSION_RECAP_STICKER_WIDTH = 940

const ACCENT = '#dfff5e'
const textShadow = '0 2px 18px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.4)'

function formatVolume(value: number): string {
    return Math.round(value).toLocaleString('fr-FR')
}

function formatPerf(weight: number, reps: number): string {
    return weight === 0 ? `${reps} reps` : `${weight} kg × ${reps}`
}

function RecapShareLogo() {
    return (
        <img
            src={resolvePublicAssetUrl('logo-white-text.png')}
            alt="One More"
            width={400}
            height={112}
            crossOrigin="anonymous"
            decoding="async"
            className="h-[4.5rem] w-auto object-contain object-left"
        />
    )
}

function Eyebrow({ children }: { children: ReactNode }) {
    return (
        <p className="text-[2.25rem] font-medium uppercase tracking-wider text-white/80">
            {children}
        </p>
    )
}

function StatsBody({ payload }: { payload: SessionRecapSharePayload }) {
    const stats = [
        { label: UI.recapDuration, value: payload.durationLabel, lime: false },
        { label: UI.recapSets, value: String(payload.setCount), lime: false },
        {
            label: UI.recapStoryRecordsLabel,
            value: String(payload.recordCount),
            lime: payload.recordCount > 0,
        },
    ]
    return (
        <div className="space-y-4">
            <Eyebrow>
                {UI.recapStorySessionOf.replace('{date}', payload.dateLabel)}
            </Eyebrow>
            <p className="font-one-more font-bold italic leading-[0.9] tracking-tight tabular-nums">
                <span className="text-[11rem]">
                    {formatVolume(payload.volume)}
                </span>
                <span className="ml-4 text-[4.5rem] uppercase">
                    {UI.recapVolumeUnit}
                </span>
            </p>
            <div className="flex gap-16">
                {stats.map((stat) => (
                    <div key={stat.label} className="space-y-1">
                        <p className="text-[2rem] font-medium uppercase tracking-wider text-white/75">
                            {stat.label}
                        </p>
                        <p
                            className="font-one-more text-[4.5rem] font-bold uppercase italic leading-none tabular-nums"
                            style={stat.lime ? { color: ACCENT } : undefined}
                        >
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function MusclesBody({ payload }: { payload: SessionRecapSharePayload }) {
    const top = payload.muscles.slice(0, 3)
    const maxSets = Math.max(1, ...payload.muscles.map((muscle) => muscle.sets))
    const data: ExtendedBodyPart[] = payload.muscles.map((muscle) => ({
        slug: muscle.slug,
        styles: {
            fill: `rgba(223,255,94,${(0.45 + 0.55 * (muscle.sets / maxSets)).toFixed(2)})`,
        },
    }))
    return (
        <div className="space-y-4">
            <Eyebrow>{UI.recapStoryMusclesTitle}</Eyebrow>
            <div className="flex justify-center gap-6">
                {(['front', 'back'] as const).map((side) => (
                    <Body
                        key={side}
                        data={data}
                        gender="male"
                        side={side}
                        scale={1.9}
                        border="rgba(255,255,255,0.28)"
                        defaultFill="rgba(255,255,255,0.14)"
                        defaultStroke="none"
                    />
                ))}
            </div>
            <ul className="flex flex-wrap gap-x-10 gap-y-2">
                {top.map((muscle) => (
                    <li
                        key={muscle.slug}
                        className="font-one-more text-[3.5rem] font-bold uppercase italic leading-[1.05]"
                    >
                        {muscle.label}
                    </li>
                ))}
            </ul>
        </div>
    )
}

function RecordsBody({ payload }: { payload: SessionRecapSharePayload }) {
    return (
        <div className="space-y-4">
            <p className="font-one-more text-[7rem] font-bold uppercase italic leading-[0.95]">
                <span className="tabular-nums">{payload.recordCount}</span>{' '}
                {payload.recordCount === 1
                    ? UI.recapStoryRecordsLeadOne
                    : UI.recapStoryRecordsLead}{' '}
                <span
                    className="rounded-xl px-4 text-black"
                    style={{ backgroundColor: ACCENT }}
                >
                    {payload.recordCount === 1
                        ? UI.recapStoryRecordsWordOne
                        : UI.recapStoryRecordsWord}
                </span>
            </p>
            <ul className="space-y-3">
                {payload.records.map((record) => (
                    <li
                        key={record.name}
                        className="flex items-baseline justify-between gap-8 text-[2.75rem]"
                    >
                        <span className="min-w-0 truncate text-white/85">
                            {record.name}
                        </span>
                        <span className="shrink-0 font-one-more font-bold italic tabular-nums">
                            {formatPerf(record.weight, record.reps)}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

function LeagueBody({ payload }: { payload: SessionRecapSharePayload }) {
    if (!payload.league) return null
    const { league, exerciseName } = payload.league
    const percent = Math.round(league.progressToNext * 100)
    const fill = leagueMapFill(league.tier, true)
    return (
        <div className="space-y-4">
            <Eyebrow>{UI.recapStoryLeagueTitle}</Eyebrow>
            <RankBadge
                league={league}
                size="xl"
                variant="dark"
                className="origin-left scale-[2]"
            />
            <div className="space-y-5 pt-6">
                <p className="font-one-more text-[4rem] font-bold uppercase italic leading-[1.05]">
                    {exerciseName}
                </p>
                <div className="h-5 w-full overflow-hidden rounded-full bg-white/20">
                    <div
                        className="h-full rounded-full"
                        style={{
                            width: `${Math.max(4, percent)}%`,
                            backgroundColor: fill,
                        }}
                    />
                </div>
                <p className="text-[2.25rem] font-medium text-white/80">
                    {UI.recapStoryLeagueProgress.replace(
                        '{percent}',
                        String(percent),
                    )}
                </p>
            </div>
        </div>
    )
}

function VariantBody({
    variant,
    payload,
}: {
    variant: SessionRecapShareVariant
    payload: SessionRecapSharePayload
}) {
    switch (variant) {
        case 'muscles':
            return <MusclesBody payload={payload} />
        case 'records':
            return <RecordsBody payload={payload} />
        case 'league':
            return <LeagueBody payload={payload} />
        default:
            return <StatsBody payload={payload} />
    }
}

/**
 * Carte story de la séance : 1080x1920 (photo ou fond One More) ou sticker
 * transparent (panneau seul, fond laissé libre).
 */
export function SessionRecapShareCard({
    payload,
    variant,
    mode,
    photoUrl,
    isDark = true,
}: {
    payload: SessionRecapSharePayload
    variant: SessionRecapShareVariant
    mode: SessionRecapShareMode
    /** Photo de l'utilisateur (data URL) pour le mode « Sur ma photo ». */
    photoUrl?: string | null
    isDark?: boolean
}) {
    if (mode === 'sticker') {
        return (
            <div
                data-share-card-root
                className="inline-block antialiased text-white"
                style={{
                    ...shareCardThemeVars(isDark),
                    width: SESSION_RECAP_STICKER_WIDTH,
                    color: '#ffffff',
                    background: 'transparent',
                }}
            >
                <div
                    className="space-y-10 rounded-[4.5rem] px-16 py-14"
                    style={{
                        backgroundColor: 'rgba(10,10,10,0.84)',
                        boxShadow: '0 0 0 2px rgba(255,255,255,0.14)',
                    }}
                >
                    <RecapShareLogo />
                    <VariantBody variant={variant} payload={payload} />
                </div>
            </div>
        )
    }

    return (
        <div
            data-share-card-root
            className="inline-block antialiased text-white"
            style={{
                ...shareCardThemeVars(isDark),
                width: SESSION_RECAP_SHARE_WIDTH,
                height: SESSION_RECAP_SHARE_HEIGHT,
                minWidth: SESSION_RECAP_SHARE_WIDTH,
                minHeight: SESSION_RECAP_SHARE_HEIGHT,
                color: '#ffffff',
            }}
        >
            <div
                className="relative size-full overflow-hidden"
                style={{
                    width: SESSION_RECAP_SHARE_WIDTH,
                    height: SESSION_RECAP_SHARE_HEIGHT,
                    background: shareStoryMeshBackground(ACCENT, isDark),
                }}
            >
                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt=""
                        decoding="sync"
                        className="absolute inset-0 size-full object-cover"
                    />
                ) : null}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ background: shareStoryVignette() }}
                />
                <div
                    className={cn(
                        'relative z-[1] flex size-full flex-col justify-end gap-12',
                        'px-20 pb-28 pt-20',
                    )}
                    style={{ textShadow }}
                >
                    <RecapShareLogo />
                    <VariantBody variant={variant} payload={payload} />
                </div>
            </div>
        </div>
    )
}
