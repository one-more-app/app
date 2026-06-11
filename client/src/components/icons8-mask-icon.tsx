import { cn } from '@/lib/utils'

/** Icône Icons8 recolorable via `currentColor` (masque CSS). */
export function Icons8MaskIcon({
    src,
    className,
}: {
    src: string
    className?: string
}) {
    return (
        <span
            className={cn('inline-block shrink-0 bg-current', className)}
            style={{
                maskImage: `url(${src})`,
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: `url(${src})`,
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
            }}
            aria-hidden
        />
    )
}
