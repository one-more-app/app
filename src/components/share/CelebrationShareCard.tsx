import { Badge } from '@/components/ui/badge'
import {
    leagueCelebrationRadialBackground,
    recordCelebrationGlow,
    shareCardThemeVars,
} from '@/lib/celebration-visual'
import { getShareableExerciseImageUrl, resolvePublicAssetUrl } from '@/lib/exercise-share-media'
import { LEAGUE_COLORS, leagueMapFill } from '@/lib/league-colors'
import type {
    LeaguePromotionPayload,
    NewRecordCelebrationPayload,
} from '@/lib/perf-notifications'
import { UI } from '@/lib/translations'
import { ArrowRight, Trophy } from 'lucide-react'
import type { CSSProperties } from 'react'

export type CelebrationShareOpen =
    | { kind: 'league'; payload: LeaguePromotionPayload }
    | { kind: 'record'; payload: NewRecordCelebrationPayload }

type CelebrationShareCardProps = {
    open: CelebrationShareOpen
    isDark: boolean
}

/**
 * Typo / gaps calés sur `LeaguePromotionCelebration` (text-xl / base / lg / sm / xs, gap-5 / 3 / 2)
 * avec facteur ×2.5 pour le rendu story (~1080px de large utile).
 * Classes en littéraux pour que Tailwind les voie au scan.
 */
const txl = 'text-[3.125rem]'
const tbase = 'text-[2.5rem]'
const tlg = 'text-[2.813rem]'
const tsm = 'text-[2.188rem]'
const txs = 'text-[1.875rem]'
const trophyMain = 'size-[8.75rem]'
const iconTrophySm = 'size-[1.875rem]'
const iconArrow = 'size-[3.125rem]'
const gapMain = 'gap-[3.125rem]'
const gapHeader = 'gap-[1.875rem]'
const gapSm = 'gap-[1.25rem]'
/** Comme la modale : `0_6px_20px` × facteur 2.5. */
const dropTrophy =
    '[filter:drop-shadow(0_15px_50px_color-mix(in_srgb,var(--league-celebration)_58%,transparent))]'
/** Cadre fixe ; l’illustration est en `object-contain` + padding pour ne pas rogner les GIF. */
const exerciseFrame = 'size-[15rem]'
const exerciseInnerPad = 'p-[2rem]'
const sharePadX = 'px-[3.75rem]'
/** Même rythme que la modale : `pt-14` / `pb-4` × 2.5 */
const sharePadTop = 'pt-[8.75rem]'
const sharePadBottom = 'pb-[2.5rem]'
/** Lockup image (logo + texte), cf. `public/logo-white-text.png` */
const logoLockupH = 'h-[6.25rem]'
const logoLockupShadow =
    'drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)]'

function ShareLeagueBody({
    payload,
    leagueGlow,
}: {
    payload: LeaguePromotionPayload
    leagueGlow: string
}) {
    const { exerciseName, prevLeague, nextLeague, weight, reps } = payload
    return (
        <div className={`flex flex-col items-center ${gapMain} text-center`}>
            <div className="league-promo-trophy-anim">
                <Trophy
                    className={`mx-auto ${trophyMain} text-white ${dropTrophy}`}
                    strokeWidth={1.75}
                    aria-hidden
                />
            </div>
            <div className={`flex flex-col items-center ${gapHeader} space-y-0`}>
                <h2
                    className={`text-balance ${txl} font-semibold tracking-tight text-card-foreground`}
                >
                    {UI.leaguePromotionCelebrationTitle}
                </h2>
                <p className={`${tbase} capitalize text-foreground/90`}>{exerciseName}</p>
            </div>
            <p className={`font-one-more ${tlg} font-bold italic text-primary`}>
                {UI.leaguePromotionCelebrationPerf
                    .replace('{weight}', String(weight))
                    .replace('{reps}', String(reps))}
            </p>
            {!prevLeague ? (
                <div
                    className={`flex flex-col items-center ${gapHeader}`}
                    style={{ ['--league-glow']: leagueGlow } as CSSProperties}
                >
                    <p className={`${tsm} font-medium`} style={{ color: 'var(--league-celebration)' }}>
                        {UI.leaguePromotionCelebrationFirst}
                    </p>
                    <div
                        className="league-promo-ring-anim rounded-xl px-2 py-1"
                        style={{ ['--league-glow']: leagueGlow } as CSSProperties}
                    >
                        <Badge
                            variant="outline"
                            className={`px-3 py-1 ${tsm} ${LEAGUE_COLORS[nextLeague.level]}`}
                        >
                            <Trophy
                                className={`mr-1 ${iconTrophySm}`}
                                aria-hidden
                                style={{ color: 'var(--league-celebration)' }}
                            />
                            {nextLeague.label}
                        </Badge>
                    </div>
                </div>
            ) : (
                <div
                    className={`flex max-w-full flex-wrap items-center justify-center ${gapHeader}`}
                >
                    <Badge
                        variant="outline"
                        className={`shrink-0 px-2.5 py-1 ${txs} whitespace-normal text-center ${LEAGUE_COLORS[prevLeague.level]}`}
                    >
                        {prevLeague.label}
                    </Badge>
                    <ArrowRight
                        className={`league-promo-nudge-anim shrink-0 ${iconArrow}`}
                        aria-hidden
                        style={{ color: 'var(--league-celebration)' }}
                    />
                    <div
                        className="league-promo-ring-anim rounded-xl"
                        style={{ ['--league-glow']: leagueGlow } as CSSProperties}
                    >
                        <Badge
                            variant="outline"
                            className={`shrink-0 px-2.5 py-1 ${txs} whitespace-normal text-center ${LEAGUE_COLORS[nextLeague.level]}`}
                        >
                            <Trophy
                                className={`mr-1 ${iconTrophySm}`}
                                aria-hidden
                                style={{ color: 'var(--league-celebration)' }}
                            />
                            {nextLeague.label}
                        </Badge>
                    </div>
                </div>
            )}
        </div>
    )
}

function ShareRecordBody({
    payload,
    leagueGlow,
}: {
    payload: NewRecordCelebrationPayload
    leagueGlow: string
}) {
    const { exerciseName, weight, reps, leagueAfter } = payload
    return (
        <div className={`flex flex-col items-center ${gapMain} text-center`}>
            <div className="league-promo-trophy-anim">
                <Trophy
                    className={`mx-auto ${trophyMain} text-white ${dropTrophy}`}
                    strokeWidth={1.75}
                    aria-hidden
                />
            </div>
            <div className={`flex flex-col items-center ${gapHeader} space-y-0`}>
                <h2
                    className={`text-balance ${txl} font-semibold tracking-tight text-card-foreground`}
                >
                    {UI.newRecordCelebrationTitle}
                </h2>
                <p className={`${tbase} capitalize text-foreground/90`}>{exerciseName}</p>
            </div>
            <p className={`font-one-more ${tlg} font-bold italic text-primary`}>
                {UI.leaguePromotionCelebrationPerf
                    .replace('{weight}', String(weight))
                    .replace('{reps}', String(reps))}
            </p>
            {leagueAfter ? (
                <div
                    className={`flex flex-col items-center ${gapSm}`}
                    style={{ ['--league-glow']: leagueGlow } as CSSProperties}
                >
                    <div className="league-promo-ring-anim rounded-xl">
                        <Badge
                            variant="outline"
                            className={`px-3 py-1 ${tsm} ${LEAGUE_COLORS[leagueAfter.level]}`}
                        >
                            <Trophy
                                className={`mr-1 ${iconTrophySm}`}
                                aria-hidden
                                style={{ color: 'var(--league-celebration)' }}
                            />
                            {leagueAfter.label}
                        </Badge>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

/** Largeur fixe export ; hauteur = contenu (moins d’espace vide qu’un 9:16 plein écran). */
export const CELEBRATION_SHARE_WIDTH = 1080

/**
 * Carte portrait pour export partage (1080px de large, hauteur suivant le contenu).
 */
export function CelebrationShareCard({ open, isDark }: CelebrationShareCardProps) {
    const leagueGlow =
        open.kind === 'league'
            ? leagueMapFill(open.payload.nextLeague.level, isDark)
            : recordCelebrationGlow(open.payload.leagueAfter, isDark)

    const exerciseRaw = open.payload.exerciseImageUrl
    const exerciseSrc =
        getShareableExerciseImageUrl(exerciseRaw) ??
        (exerciseRaw?.trim() ? exerciseRaw.trim() : null)
    const logoSrc = resolvePublicAssetUrl('logo-white-text.png')

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
                className="relative flex flex-col overflow-hidden rounded-xl border-2 border-border bg-card text-card-foreground shadow-lg"
                style={
                    {
                        '--league-celebration': leagueGlow,
                        width: CELEBRATION_SHARE_WIDTH,
                    } as CSSProperties
                }
            >
                <div
                    aria-hidden
                    className={`pointer-events-none absolute inset-0 ${isDark ? 'opacity-100' : 'opacity-95'}`}
                    style={{
                        background: leagueCelebrationRadialBackground(leagueGlow),
                    }}
                />
                <div
                    className={`relative z-[1] flex flex-col ${sharePadX} ${sharePadBottom} ${sharePadTop} ${gapMain}`}
                >
                    {exerciseSrc ? (
                        <div
                            className={`${exerciseFrame} ${exerciseInnerPad} mx-auto flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 shadow-sm bg-muted/25`}
                            style={{
                                borderColor: `color-mix(in srgb, ${leagueGlow} 55%, transparent)`,
                            }}
                        >
              <img
                src={exerciseSrc}
                alt=""
                width={220}
                height={220}
                crossOrigin="anonymous"
                decoding="async"
                className="max-h-full max-w-full object-contain"
              />
                        </div>
                    ) : null}

                    <div className="flex w-full flex-col items-center">
                        {open.kind === 'league' ? (
                            <ShareLeagueBody payload={open.payload} leagueGlow={leagueGlow} />
                        ) : (
                            <ShareRecordBody payload={open.payload} leagueGlow={leagueGlow} />
                        )}
                    </div>

                    <div className="flex shrink-0 items-center justify-center opacity-95">
                        <img
                            src={logoSrc}
                            alt="One More"
                            width={360}
                            height={100}
                            crossOrigin="anonymous"
                            className={`${logoLockupH} w-auto max-w-[90%] object-contain ${logoLockupShadow}`}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
