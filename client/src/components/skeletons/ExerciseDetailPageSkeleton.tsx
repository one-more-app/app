import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ExerciseCardSkeleton } from '@/components/skeletons/ExerciseCardSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

export function ExerciseDetailPageSkeleton() {
    return (
        <div className="space-y-4" aria-busy="true" aria-label="Chargement">
            <ExerciseCardSkeleton imageSize="sm" />

            <Card className="gap-0">
                <CardHeader className="gap-0 pb-2">
                    <Skeleton className="h-4 w-16" />
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                    <Skeleton className="h-7 w-24 rounded-md" />
                    <Skeleton className="h-3 w-full max-w-[16rem]" />
                    <Skeleton className="h-8 w-full rounded-lg" />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <Skeleton className="h-4 w-36" />
                </CardHeader>
                <CardContent className="space-y-4 pb-4 pt-0">
                    <Skeleton className="h-40 w-full rounded-lg" />
                    <div className="border-t border-border pt-3 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        {Array.from({ length: 3 }, (_, i) => (
                            <Skeleton key={i} className="h-10 w-full rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                </CardHeader>
            </Card>
        </div>
    )
}
