import { Button } from '@/components/ui/button'
import { useBack } from '@/hooks/use-back'
import { UI } from '@/lib/translations'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

export function BackHeader({
    title,
    description,
    right,
    compact,
    titleClassName,
    onBack,
    embedded = false,
}: {
    title: ReactNode
    right?: ReactNode
    compact?: boolean
    titleClassName?: string
    onBack?: () => void
    /** Rendu sans wrapper sticky (parent gère le positionnement). */
    embedded?: boolean
}) {
    const goBack = useBack()
    const handleBack = onBack ?? goBack

    const content = (
        <div
            className={cn(
                'mx-auto flex max-w-2xl items-center',
                compact ? 'gap-2' : 'gap-4',
            )}
        >
            <Button
                variant="secondary"
                size="icon"
                className="shrink-0"
                onClick={handleBack}
                aria-label={UI.back}
            >
                <ArrowLeft className="size-4" />
            </Button>
            <div className="min-w-0 flex-1 flex flex-col">
                <h1 className={cn('truncate text-sm font-one-more uppercase italic', titleClassName)}>{title}</h1>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {right != null ? <div className="shrink-0">{right}</div> : null}
        </div>
    )

    if (embedded) {
        return <div className="px-4 py-3">{content}</div>
    }

    return (
        <header
            data-sticky-app-header
            className="sticky-top-safe z-100 bg-card px-4 py-3 border-b border-border"
        >
            {content}
        </header>
    )
}

