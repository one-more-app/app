import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function HistoryDaySkeleton() {
    return (
        <li className="space-y-3" aria-hidden>
            <Skeleton className="h-4 w-28" />
            <ul className="space-y-3">
                {[0, 1].map((i) => (
                    <li key={i}>
                        <Card className="overflow-hidden py-0">
                            <div className="flex items-center gap-3 px-4 py-3">
                                <Skeleton className="size-10 shrink-0 rounded-lg" />
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <Skeleton className="h-4 w-2/3 max-w-[10rem]" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                                <Skeleton className="size-8 shrink-0 rounded-lg" />
                            </div>
                        </Card>
                    </li>
                ))}
            </ul>
        </li>
    )
}

export function HistoryPageSkeleton() {
    return (
        <ul className="space-y-8" aria-busy="true" aria-label="Chargement">
            {[0, 1, 2].map((i) => (
                <HistoryDaySkeleton key={i} />
            ))}
        </ul>
    )
}
