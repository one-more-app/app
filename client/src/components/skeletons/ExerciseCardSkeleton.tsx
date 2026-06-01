import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type ExerciseCardSkeletonProps = {
    imageSize?: 'sm' | 'md'
    className?: string
    compact?: boolean
}

const imageSizes = { sm: 'size-12', md: 'size-14' } as const

export function ExerciseCardSkeleton({
    imageSize = 'md',
    className,
    compact = false,
}: ExerciseCardSkeletonProps) {
    const sizeClass = imageSizes[imageSize]

    return (
        <Card className={className} aria-hidden>
            <CardHeader
                className={cn(
                    'flex min-w-0 flex-row items-center gap-4',
                    compact ? 'pb-0' : 'pb-2',
                )}
            >
                <Skeleton className={cn(sizeClass, 'shrink-0 rounded-lg')} />
                <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/5 max-w-[12rem]" />
                    <div className="flex gap-1.5">
                        <Skeleton className="h-5 w-16 rounded-md" />
                        <Skeleton className="h-5 w-14 rounded-md" />
                    </div>
                </div>
                <Skeleton className="size-11 shrink-0 rounded-full" />
            </CardHeader>
            {!compact ? (
                <CardContent className="border-t pb-0">
                    <div className="flex gap-4">
                        <Skeleton className="h-[4.5rem] flex-1 rounded-lg" />
                        <Skeleton className="h-[4.5rem] flex-1 rounded-lg" />
                    </div>
                </CardContent>
            ) : null}
        </Card>
    )
}

export function ExerciseCardSkeletonList({
    count = 4,
    imageSize = 'md',
    compact = false,
    className,
}: {
    count?: number
    imageSize?: 'sm' | 'md'
    compact?: boolean
    className?: string
}) {
    return (
        <ul className={cn('space-y-3', className)} aria-busy="true" aria-label="Chargement">
            {Array.from({ length: count }, (_, i) => (
                <li key={i}>
                    <ExerciseCardSkeleton imageSize={imageSize} compact={compact} />
                </li>
            ))}
        </ul>
    )
}
