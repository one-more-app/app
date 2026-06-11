import { RankBadge } from '@/components/RankBadge'
import type { LeagueInfo } from '@/lib/strength-standards'
import { getNextRankId, parseRankId } from '@/lib/strength-standards'
import { UI } from '@/lib/translations'
import { LEAGUE_1RM_STYLES } from '@/lib/league-colors'

interface LeagueBadgeProps {
    league: LeagueInfo
    showNextTarget?: boolean
    compact?: boolean
    weightSuffix?: string
}

const DEFAULT_WEIGHT_SUFFIX = ' kg'

export function LeagueBadge({
    league,
    showNextTarget = false,
    compact = false,
    weightSuffix = DEFAULT_WEIGHT_SUFFIX,
}: LeagueBadgeProps) {
    const oneRMStyle = LEAGUE_1RM_STYLES[league.tier] ?? 'border border-muted bg-muted/20'
    const nextRankId = league.nextRankId ?? getNextRankId(league.rankId)
    const nextTier = nextRankId != null ? parseRankId(nextRankId).tier : null

    if (compact) {
        return <RankBadge league={league} size="sm" />
    }

    const remainingKg =
        league.progressToNext < 1
            ? Math.max(0, league.weightToReach - league.oneRM).toFixed(1)
            : null

    return (
        <div className="rounded-lg space-y-4">
            <div className="flex items-center justify-between gap-2">
                <RankBadge league={league} size="md" />
                <span className="text-sm text-muted-foreground">
                    {UI.percentileDescription.replace('{p}', String(league.percentileEstimate))}
                </span>
            </div>

            <div className={`rounded-lg p-3 ${oneRMStyle}`}>
                <span className="text-sm text-muted-foreground">{UI.your1RM}</span>
                <div className="flex items-center gap-2">
                    <span className="font-one-more block text-2xl font-bold italic text-foreground">
                        {league.oneRM.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">{weightSuffix}</span>
                </div>
            </div>

            {showNextTarget && league.progressToNext < 1 && (
                <div className="space-y-3">
                    {remainingKg && Number(remainingKg) > 0 && nextRankId && nextTier && (
                        <p className="flex items-center gap-1.5 text-xs font-medium text-foreground flex-wrap">
                            {UI.remainingForNext.replace('{kg}', remainingKg)}
                            <RankBadge rankId={nextRankId} size="xs" />
                        </p>
                    )}
                    <div className="flex justify-between items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            {league.weightTierStart.toFixed(1)}{weightSuffix}
                            <RankBadge league={league} size="xs" />
                        </span>
                        <span className="flex items-center gap-1.5">
                            {league.weightTierEnd != null ? (
                                <>
                                    {league.weightTierEnd.toFixed(1)}{weightSuffix}
                                    {nextRankId && nextTier && (
                                        <RankBadge rankId={nextRankId} size="xs" />
                                    )}
                                </>
                            ) : (
                                '—'
                            )}
                        </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full rounded-full bg-primary dark:bg-primary-foreground transition-all"
                            style={{ width: `${league.progressToNext * 100}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
