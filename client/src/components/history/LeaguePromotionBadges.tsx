import { Badge } from '@/components/ui/badge'
import { LEAGUE_COLORS } from '@/lib/league-colors'
import type { LeagueInfo } from '@/lib/strength-standards'
import { UI } from '@/lib/translations'
import { cn } from '@/lib/utils'

type LeaguePromotionBadgesProps = {
    prevLeague: LeagueInfo | null
    nextLeague: LeagueInfo
    /** En-tête replié : pastilles plus compactes. */
    compact?: boolean
    className?: string
}

/**
 * Passage de palier : ancienne ligue → nouvelle (sans animation, lisible sur une ligne).
 */
export function LeaguePromotionBadges({
    prevLeague,
    nextLeague,
    compact = false,
    className,
}: LeaguePromotionBadgesProps) {
    const sizeClass = compact
        ? 'inline-flex h-5 shrink-0 items-center rounded-md px-1.5 py-0 text-[10px] leading-none'
        : 'text-xs'

    return (
        <span
            className={cn(
                'inline-flex shrink-0 flex-wrap items-center gap-0.5',
                className,
            )}
            title={UI.leaguePromotion}
        >
            {prevLeague ? (
                <>
                    <Badge
                        variant="outline"
                        className={cn(
                            'shrink-0 overflow-visible whitespace-nowrap',
                            sizeClass,
                            'opacity-80',
                            LEAGUE_COLORS[prevLeague.tier],
                        )}
                    >
                        {prevLeague.label}
                    </Badge>
                    <span
                        className={cn(
                            'inline-flex shrink-0 items-center text-muted-foreground',
                            compact ? 'h-5 text-[10px]' : 'text-xs',
                        )}
                        aria-hidden
                    >
                        →
                    </span>
                </>
            ) : null}
            <Badge
                variant="outline"
                className={cn(
                    'shrink-0 overflow-visible whitespace-nowrap',
                    sizeClass,
                    LEAGUE_COLORS[nextLeague.tier],
                )}
            >
                {nextLeague.label}
            </Badge>
        </span>
    )
}
