import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function SettingsProfileSkeleton() {
    return (
        <Card aria-busy="true" aria-label="Chargement">
            <CardHeader>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="mt-2 h-3 w-full max-w-sm" />
            </CardHeader>
            <CardContent className="space-y-4">
                {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                ))}
                <Skeleton className="h-9 w-full rounded-lg" />
            </CardContent>
        </Card>
    )
}
