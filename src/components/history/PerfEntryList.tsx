import { HistoryPerfRow } from '@/components/history/HistoryPerfRow'
import { Button } from '@/components/ui/button'
import type { HistoryEntryInsight } from '@/lib/history-entries'
import { UI } from '@/lib/translations'
import { cn } from '@/lib/utils'
import type { PerformanceEntry } from '@/types'

type PerfEntryListProps = {
    className?: string
    listClassName?: string
    entries: PerformanceEntry[]
    entryInsights: Map<string, HistoryEntryInsight>
    canEdit: boolean
    onEditEntry: (entry: PerformanceEntry) => void
    onDeleteEntry: (entry: PerformanceEntry) => void
    onAddSet?: () => void
}

export function PerfEntryList({
    className,
    listClassName,
    entries,
    entryInsights,
    canEdit,
    onEditEntry,
    onDeleteEntry,
    onAddSet,
}: PerfEntryListProps) {
    return (
        <div className={cn(className)}>
            <ul
                className={cn(
                    'space-y-2',
                    listClassName,
                )}
            >
                {entries.map((entry) => (
                    <HistoryPerfRow
                        key={entry.id}
                        entry={entry}
                        insight={entryInsights.get(entry.id)}
                        canEdit={canEdit}
                        onEdit={() => onEditEntry(entry)}
                        onDelete={() => onDeleteEntry(entry)}
                    />
                ))}
            </ul>
            {onAddSet ? (
                <div className="pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        onClick={onAddSet}
                    >
                        {UI.addSet}
                    </Button>
                </div>
            ) : null}
        </div>
    )
}
