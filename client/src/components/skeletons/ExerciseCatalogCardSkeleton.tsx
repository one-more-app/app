import { Card, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ExerciseCatalogCardSkeleton() {
    return (
        <Card aria-hidden>
            <CardHeader className="flex min-w-0 flex-row items-center gap-3">
                <Skeleton className="size-12 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-4/5 max-w-[14rem]" />
                    <div className="flex gap-1">
                        <Skeleton className="h-5 w-14 rounded-md" />
                        <Skeleton className="h-5 w-12 rounded-md" />
                    </div>
                </div>
                <Skeleton className="h-8 w-16 shrink-0 rounded-lg" />
            </CardHeader>
        </Card>
    )
}

export function ExerciseCatalogSkeletonList({ count = 6 }: { count?: number }) {
    return (
        <ul className="space-y-2" aria-busy="true" aria-label="Chargement">
            {Array.from({ length: count }, (_, i) => (
                <li key={i}>
                    <ExerciseCatalogCardSkeleton />
                </li>
            ))}
        </ul>
    )
}
