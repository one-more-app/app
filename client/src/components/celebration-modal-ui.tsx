import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

export function CelebrationModalShell({
    background,
    style,
    children,
}: {
    background: string
    style?: CSSProperties
    children: ReactNode
}) {
    return (
        <div
            className="relative min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto"
            style={style}
        >
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-95 dark:opacity-100"
                style={{ background }}
            />
            <div className="relative z-[1] flex flex-col items-center gap-4 px-6 pb-4 pt-14 text-center">
                {children}
            </div>
        </div>
    )
}

export function CelebrationHeroMetric({
    icon: Icon,
    iconColor,
    iconDropShadow,
    badge,
    badgeClassName,
    ariaLabel,
}: {
    icon: LucideIcon
    iconColor: string
    iconDropShadow: string
    badge: ReactNode
    badgeClassName?: string
    ariaLabel: string
}) {
    return (
        <div
            className="celebration-hero-anim relative inline-flex"
            aria-label={ariaLabel}
        >
            <Icon
                className="size-16 shrink-0"
                style={{
                    color: iconColor,
                    filter: iconDropShadow,
                }}
                strokeWidth={1.5}
                aria-hidden
            />
            <span
                className={cn(
                    'celebration-count-anim absolute -bottom-0.5 left-1/2 flex max-w-[10rem] -translate-x-1/2 items-center justify-center rounded-full px-2.5 py-0.5 font-one-more text-sm font-bold italic tabular-nums shadow-md ring-2 ring-background',
                    badgeClassName,
                )}
            >
                {badge}
            </span>
        </div>
    )
}

export function formatPerfBadge(weight: number, reps: number): string {
    return `${weight}×${reps}`
}

export function leagueIconDropShadow(leagueColor: string): string {
    // Pas de color-mix() dans filter — jank Safari/WKWebView au premier paint.
    return `drop-shadow(0 6px 14px ${leagueColor}99)`
}
