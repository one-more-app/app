import { RankBadge } from '@/components/RankBadge'
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
    const size = compact ? 'xs' : 'sm'

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
                    <RankBadge
                        league={prevLeague}
                        size={size}
                        className="opacity-80"
                    />
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
            <RankBadge league={nextLeague} size={size} />
        </span>
    )
}
