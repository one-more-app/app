import { Badge } from '@/components/ui/badge'
import { LeaguePromotionBadges } from '@/components/history/LeaguePromotionBadges'
import type { ExerciseGroupInsightSummary } from '@/lib/history-entries'
import { UI } from '@/lib/translations'

export function HistoryCollapsedHighlights({
    seriesLabel,
    summary,
}: {
    seriesLabel: string
    summary: ExerciseGroupInsightSummary
}) {
    const showTags =
        summary.hasNewRecord || summary.leaguePromotion !== null

    const rowItem =
        'inline-flex h-5 shrink-0 items-center leading-none'
    const chipClass = `${rowItem} rounded-md px-1.5 text-[10px]`

    return (
        <p className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 leading-none">
            <span className={`${rowItem} text-xs text-muted-foreground`}>
                {seriesLabel}
            </span>
            {showTags ? (
                <>
                    <span
                        className="inline-flex h-5 shrink-0 items-center text-[10px] text-muted-foreground/50 group-data-[state=open]/coll:hidden"
                        aria-hidden
                    >
                        ·
                    </span>
                    {summary.hasNewRecord ? (
                        <Badge
                            variant="secondary"
                            className={`${chipClass} group-data-[state=open]/coll:hidden`}
                        >
                            {UI.record}
                        </Badge>
                    ) : null}
                    {summary.leaguePromotion ? (
                        <LeaguePromotionBadges
                            className="group-data-[state=open]/coll:hidden"
                            prevLeague={summary.leaguePromotion.prevLeague}
                            nextLeague={summary.leaguePromotion.nextLeague}
                            compact
                        />
                    ) : null}
                </>
            ) : null}
        </p>
    )
}
