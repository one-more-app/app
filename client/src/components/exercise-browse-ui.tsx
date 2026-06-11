import { RankBadge } from '@/components/RankBadge'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle } from '@/components/ui/card'
import type { CatalogBrowseParams, CatalogBrowseStep } from '@/lib/exercise-catalog-browse'
import { hapticImpact, hapticTab } from '@/lib/haptics'
import type { RankId } from '@/lib/strength-standards'
import {
    translateBodyPart,
    translateEquipment,
    translateTarget,
    UI,
} from '@/lib/translations'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

/** Fil d'Ariane catalogue — pills brandées, compactes sur mobile. */
const browseCrumbBase =
    'inline-flex max-w-[9.5rem] shrink-0 items-center truncate rounded-full px-2.5 py-1 font-one-more text-[10px] font-semibold uppercase italic leading-none tracking-wide capitalize transition-[color,background-color,transform] active:scale-[0.97]'
const browseCrumbCurrent =
    'bg-accent text-accent-foreground'
const browseCrumbLink =
    'bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground'

/** Titre de section aligné sur la DA (titres onboarding / filtres). */
export function BrowseSectionTitle({
    children,
    className,
    ...props
}: {
    children: ReactNode
    className?: string
} & ComponentPropsWithoutRef<'h2'>) {
    return (
        <h2
            className={cn(
                'mb-2 font-one-more text-[10px] font-semibold uppercase italic tracking-normal text-muted-foreground',
                className,
            )}
            {...props}
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
    leagueLevel?: RankId | null
    onClick: () => void
}) {
    return (
        <Card className="gap-0 overflow-hidden py-0 shadow-none transition-colors hover:bg-muted/25">
            <button
                type="button"
                onClick={() => {
                    void hapticImpact()
                    onClick()
                }}
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
                    <CardTitle>
                        {label}
                    </CardTitle>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="font-normal">
                            {UI.browseExercisesCount.replace('{count}', String(count))}
                        </Badge>
                        {leagueLevel ? (
                            <RankBadge rankId={leagueLevel} size="xs" />
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
        <nav aria-label={UI.browseBreadcrumbLabel} className="mb-3 min-w-0">
            <div
                className={cn(
                    'flex items-center gap-1 overflow-x-auto rounded-xl bg-muted/35 p-1',
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
                            className="flex min-w-0 shrink-0 items-center gap-1"
                        >
                            {i > 0 ? (
                                <ChevronRight
                                    className="size-3 shrink-0 text-muted-foreground/35"
                                    aria-hidden
                                />
                            ) : null}
                            {canNavigate ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        hapticTab()
                                        onGoTo(c.step)
                                    }}
                                    className={cn(browseCrumbBase, browseCrumbLink)}
                                >
                                    {c.label}
                                </button>
                            ) : (
                                <span
                                    className={cn(browseCrumbBase, browseCrumbCurrent)}
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
