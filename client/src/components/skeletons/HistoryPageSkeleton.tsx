import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function HistoryWeekStreakSkeleton() {
    return (
        <Card className="py-3" aria-hidden>
            <CardContent className="px-2 pt-0">
            <div className="flex items-center gap-1">
                <Skeleton className="size-6 shrink-0 rounded-lg" />
                <div className="grid min-w-0 flex-1 grid-cols-7 gap-0.5">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <Skeleton className="h-2.5 w-2.5" />
                            <Skeleton className="size-7 rounded-full" />
                        </div>
                    ))}
                </div>
                <Skeleton className="size-6 shrink-0 rounded-lg" />
            </div>
            </CardContent>
        </Card>
    )
}

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
        <div className="space-y-4" aria-busy="true" aria-label="Chargement">
            <HistoryWeekStreakSkeleton />
            <ul className="space-y-8">
                {[0, 1, 2].map((i) => (
                    <HistoryDaySkeleton key={i} />
                ))}
            </ul>
        </div>
    )
}
