import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    formatPerfLabel,
    formatTimeOnly,
    type HistoryEntryInsight,
} from '@/lib/history-entries'
import { LEAGUE_COLORS } from '@/lib/league-colors'
import { UI } from '@/lib/translations'
import type { PerformanceEntry } from '@/types'
import { Pencil, Trash2 } from 'lucide-react'

type HistoryPerfRowProps = {
    entry: PerformanceEntry
    insight: HistoryEntryInsight | undefined
    canEdit: boolean
    onEdit: () => void
    onDelete: () => void
}

export function HistoryPerfRow({
    entry,
    insight,
    canEdit,
    onEdit,
    onDelete,
}: HistoryPerfRowProps) {
    const when = formatTimeOnly(entry.createdAt)

    return (
        <li>
            <Card className="py-0">
                <CardContent className="flex items-center gap-3 p-2 px-3 rounded-lg bg-secondary/50">
                    <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1">
                            <p className="text-sm font-medium">
                                {formatPerfLabel(entry.weight, entry.reps)}
                            </p>
                            {insight?.isRecord ? (
                                <Badge variant="secondary" className="shrink-0 text-xs">
                                    {UI.record}
                                </Badge>
                            ) : null}
                            {insight?.leagueUp && insight.nextLeague ? (
                                <Badge
                                    variant="outline"
                                    className={`shrink-0 text-xs ${LEAGUE_COLORS[insight.nextLeague.level] ?? 'bg-muted'}`}
                                    title={UI.leaguePromotion}
                                >
                                    {insight.nextLeague.label}
                                </Badge>
                            ) : null}
                        </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                        <div className="flex gap-1">
                            <Button
                                variant="secondary"
                                size="icon"
                                disabled={!canEdit}
                                onClick={onEdit}
                                aria-label={UI.modifyPerf}
                            >
                                <Pencil className="size-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="text-destructive"
                                onClick={onDelete}
                                aria-label={UI.deletePerf}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>

                    </div>
                </CardContent>
            </Card>
        </li>
    )
}
