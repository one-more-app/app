import { cn } from '@/lib/utils'
import type { ElementType, ReactNode } from 'react'

type ExerciseTitleProps = {
    children: ReactNode
    className?: string
    as?: ElementType
    /** 1 = une ligne avec « … », 2 = deux lignes max */
    lines?: 1 | 2
    title?: string
}

export function ExerciseTitle({
    children,
    className,
    as: Component = 'span',
    lines = 1,
    title,
}: ExerciseTitleProps) {
    const text = typeof children === 'string' ? children : undefined

    return (
        <Component
            className={cn(
                'block min-w-0',
                lines === 1 ? 'truncate' : 'line-clamp-2',
                className,
            )}
            title={title ?? text}
        >
            {children}
        </Component>
    )
}
