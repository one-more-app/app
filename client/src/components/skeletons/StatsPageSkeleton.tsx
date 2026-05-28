import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function StatsPageSkeleton() {
    return (
        <div className="space-y-4" aria-busy="true" aria-label="Chargement">
            <Skeleton className="h-8 w-full rounded-lg" />

            <Card>
                <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                    <div className="flex flex-col items-center gap-2">
                        <Skeleton className="h-7 w-24 rounded-md" />
                        <Skeleton className="h-3 w-40" />
                    </div>
                    <div className="border-t border-border pt-4">
                        <Skeleton className="mx-auto h-3 w-36" />
                        <div className="mt-3 flex justify-between gap-2">
                            <Skeleton className="h-5 w-20 rounded-md" />
                            <Skeleton className="h-5 w-20 rounded-md" />
                        </div>
                        <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-36" />
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                    <Skeleton className="mx-auto aspect-[3/4] w-full max-w-xs rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <div className="overflow-hidden rounded-lg border border-border">
                            {Array.from({ length: 5 }, (_, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5 last:border-b-0"
                                >
                                    <Skeleton className="h-4 w-28" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-5 w-16 rounded-md" />
                                        <Skeleton className="h-3 w-10" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
