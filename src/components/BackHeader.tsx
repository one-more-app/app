import { Button } from '@/components/ui/button'
import { useBack } from '@/hooks/use-back'
import { UI } from '@/lib/translations'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

export function BackHeader({
    title,
    right,
    compact,
    titleClassName,
    onBack,
}: {
    title: ReactNode
    right?: ReactNode
    compact?: boolean
    titleClassName?: string
    onBack?: () => void
}) {
    const goBack = useBack()
    const handleBack = onBack ?? goBack
    const hasRight = right != null

    return (
        <header className="sticky top-0 z-10 border-b border-white/10 bg-black px-4 py-4">
            <div
                className={[
                    'mx-auto flex max-w-2xl items-center',
                    compact ? 'gap-2' : 'gap-4',
                ].join(' ')}
            >
                <Button variant="secondary" size="icon" onClick={handleBack} aria-label={UI.back}>
                    <ArrowLeft className="size-4" />
                </Button>

                <h1
                    className={[
                        'truncate text-lg font-semibold',
                        hasRight ? 'flex-1 min-w-0' : '',
                        titleClassName ?? '',
                    ].join(' ')}
                >
                    {title}
                </h1>

                {right && <div className="shrink-0">{right}</div>}
            </div>
        </header>
    )
}

