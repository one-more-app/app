import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function HomeStatsPageSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Chargement">
            {Array.from({ length: 4 }, (_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center gap-3 pb-2">
                        <Skeleton className="size-9 rounded-lg" />
                        <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="mt-2 h-3 w-full max-w-[12rem]" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
