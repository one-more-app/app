import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type EmptyStateProps = {
    icon?: LucideIcon
    iconClassName?: string
    title?: string
    description?: string
    children?: ReactNode
    /** Conteneur extérieur (ex. mt-4, mt-6, py-20) */
    className?: string
    /** Liste / encart : Card ; page centrée : sans Card */
    variant?: 'card' | 'plain'
    cardClassName?: string
    contentClassName?: string
}

export function EmptyState({
    icon: Icon,
    iconClassName,
    title,
    description,
    children,
    className,
    variant = 'card',
    cardClassName,
    contentClassName,
}: EmptyStateProps) {
    const inner = (
        <>
            {Icon ? (
                <Icon
                    className={cn('size-7 shrink-0 text-muted-foreground ', iconClassName)}
                    aria-hidden
                />
            ) : null}
            {title ? (
                <h2 className="text-md font-medium text-foreground">{title}</h2>
            ) : null}
            {description ? (
                <p
                    className={cn(
                        'text-muted-foreground text-sm',
                    )}
                >
                    {description}
                </p>
            ) : null}
            {children}
        </>
    )

    if (variant === 'plain') {
        return (
            <div
                className={cn(
                    'flex flex-col items-center justify-center gap-3 text-center',
                    className,
                )}
            >
                {inner}
            </div>
        )
    }

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center text-center',
                className,
            )}
        >
            <Card className={cn('w-full py-0', cardClassName)}>
                <CardContent
                    className={cn(
                        'flex flex-col items-center gap-3 p-6',
                        contentClassName,
                    )}
                >
                    {inner}
                </CardContent>
            </Card>
        </div>
    )
}
