import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { CatalogBrowseParams, CatalogBrowseStep } from '@/lib/exercise-catalog-browse'
import { LEAGUE_COLORS } from '@/lib/league-colors'
import type { LeagueLevel } from '@/lib/strength-standards'
import { leagueLevelToFrenchLabel } from '@/lib/strength-standards'
import {
    translateBodyPart,
    translateEquipment,
    translateTarget,
    UI,
} from '@/lib/translations'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

/** Puces de parcours — compactes pour mobile. */
const browseCrumbBase =
    'shrink-0 rounded-md py-0.5 px-1.5 font-one-more text-[10px] font-semibold uppercase italic leading-tight tracking-normal capitalize'
const browseCrumbCurrent =
    'bg-accent text-accent-foreground ring-1 ring-accent/30'
const browseCrumbLink =
    'text-muted-foreground hover:bg-muted/40 hover:text-foreground active:bg-muted/60'

/** Titre de section aligné sur la DA (titres onboarding / filtres). */
export function BrowseSectionTitle({
    children,
    className,
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <h2
            className={cn(
                'mb-2 font-one-more text-[10px] font-semibold uppercase italic leading-tight tracking-normal text-muted-foreground',
                className,
            )}
        >
            {children}
        </h2>
    )
}

export function BrowseTile({
    label,
    count,
    icon,
    leagueLevel,
    onClick,
}: {
    label: string
    count: number
    icon?: ReactNode
    /** Palier médian du groupe (accueil, zones du corps). */
    leagueLevel?: LeagueLevel | null
    onClick: () => void
}) {
    return (
        <Card className="gap-0 overflow-hidden py-0 shadow-none transition-colors hover:bg-muted/25">
            <button
                type="button"
                onClick={onClick}
                className="flex w-full min-w-0 items-center gap-3 p-3 text-left active:bg-muted/40"
            >
                {icon ? (
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                        {icon}
                    </span>
                ) : (
                    <span className="size-12 shrink-0 rounded-lg bg-muted" />
                )}
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-semibold capitalize leading-snug">
                        {label}
                    </span>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="font-normal">
                            {UI.browseExercisesCount.replace('{count}', String(count))}
                        </Badge>
                        {leagueLevel ? (
                            <Badge
                                className={cn(
                                    'font-normal text-xs',
                                    LEAGUE_COLORS[leagueLevel],
                                )}
                            >
                                {leagueLevelToFrenchLabel(leagueLevel)}
                            </Badge>
                        ) : null}
                    </div>
                </span>
                <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                />
            </button>
        </Card>
    )
}

export function CatalogBreadcrumb({
    browse,
    onGoTo,
}: {
    browse: CatalogBrowseParams
    onGoTo: (step: CatalogBrowseStep) => void
}) {
    const crumbs: { label: string; step: CatalogBrowseStep }[] = [
        { label: UI.browseBreadcrumbZones, step: 'zone' },
    ]
    if (browse.zone) {
        crumbs.push({
            label: translateBodyPart(browse.zone),
            step: 'muscle',
        })
    }
    if (browse.zone && browse.target) {
        crumbs.push({
            label: translateTarget(browse.target),
            step: 'equipment',
        })
    }
    if (browse.zone && browse.target && browse.beq) {
        crumbs.push({
            label: translateEquipment(browse.beq),
            step: 'list',
        })
    }

    if (crumbs.length <= 1 && browse.step === 'zone') {
        return null
    }

    return (
        <nav aria-label={UI.browseBreadcrumbLabel} className="mb-2 min-w-0">
            <div
                className={cn(
                    'flex items-center gap-0.5 overflow-x-auto',
                    '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                )}
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                {crumbs.map((c, i) => {
                    const isCurrent =
                        (c.step === 'zone' && browse.step === 'zone') ||
                        (c.step === 'muscle' && browse.step === 'muscle') ||
                        (c.step === 'equipment' && browse.step === 'equipment') ||
                        (c.step === 'list' && browse.step === 'list')
                    const canNavigate = !isCurrent

                    return (
                        <span
                            key={`${c.step}-${i}`}
                            className="flex shrink-0 items-center gap-0.5"
                        >
                            {i > 0 ? (
                                <span
                                    className="shrink-0 px-px font-one-more text-[10px] font-semibold italic text-muted-foreground/45 select-none"
                                    aria-hidden
                                >
                                    /
                                </span>
                            ) : null}
                            {canNavigate ? (
                                <button
                                    type="button"
                                    onClick={() => onGoTo(c.step)}
                                    className={cn(
                                        browseCrumbBase,
                                        browseCrumbLink,
                                        'inline-flex items-center transition-colors',
                                    )}
                                >
                                    {c.label}
                                </button>
                            ) : (
                                <span
                                    className={cn(
                                        'inline-flex items-center',
                                        browseCrumbBase,
                                        browseCrumbCurrent,
                                    )}
                                    aria-current="step"
                                >
                                    {c.label}
                                </span>
                            )}
                        </span>
                    )
                })}
            </div>
        </nav>
    )
}
