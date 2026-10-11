import { Dumbbell, Home, Settings, Users } from 'lucide-react'
import type { JSX } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { UnreadCountBadge } from '@/components/ui/unread-count-badge'
import { useFriendsBadgeCount } from '@/hooks/use-friends-badge-count'
import { hapticTab } from '@/lib/haptics'
import { UI } from '@/lib/translations'
import { cn } from '@/lib/utils'

const NAV_ITEMS: Array<{
    to: string
    label: string
    tourId: string
    Icon: (props: { className?: string }) => JSX.Element
}> = [
    { to: '/home', label: UI.navHome, tourId: 'nav-home', Icon: Home },
    { to: '/exercises', label: UI.navExercises, tourId: 'nav-exercises', Icon: Dumbbell },
    { to: '/social', label: UI.navSocial, tourId: 'nav-social', Icon: Users },
    { to: '/settings', label: UI.navSettings, tourId: 'nav-settings', Icon: Settings },
]

function isNavItemActive(pathname: string, to: string): boolean {
    if (to === '/home') return pathname === '/home' || pathname === '/profile'
    if (to === '/exercises') return pathname === '/exercises'
    if (to === '/social') {
        return (
            pathname === '/social' ||
            pathname === '/ranking' ||
            pathname === '/friends' ||
            pathname.startsWith('/friends/')
        )
    }
    if (to === '/settings') return pathname === '/settings'
    return pathname === to
}

function BottomNav() {
    const location = useLocation()
    const pathname = location.pathname
    const friendsBadge = useFriendsBadgeCount()

    return (
        <nav
            className="border-t border-border fixed bottom-0 left-0 right-0 z-20 bg-card pl-[var(--safe-left)] pr-[var(--safe-right)] pb-[var(--safe-bottom)]"
            aria-label="Navigation"
            data-analytics-section="bottom_nav"
        >
            <div className="mx-auto flex h-[var(--bottom-nav-height)] max-w-2xl items-center justify-around px-4">
                {NAV_ITEMS.map((item) => {
                    const active = isNavItemActive(pathname, item.to)
                    const showUnreadBadge =
                        item.to === '/social' && friendsBadge > 0
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            data-tour={item.tourId}
                            onClick={() => {
                                if (!active) hapticTab()
                            }}
                            aria-current={active ? 'page' : undefined}
                            aria-label={
                                showUnreadBadge
                                    ? UI.navFriendsBadgeAria
                                          .replace('{label}', item.label)
                                          .replace('{count}', String(friendsBadge))
                                    : item.label
                            }
                            className={cn(
                                'flex flex-1 flex-col items-center justify-center gap-0.5 text-center rounded-lg outline-none',
                                'transition-transform active:scale-[0.97] transition-colors',
                                active ? 'text-foreground' : 'text-muted-foreground'
                            )}
                        >
                            <div
                                className={cn(
                                    'relative flex h-8 w-12 items-center justify-center rounded-[10px]',
                                    active ? 'bg-accent' : undefined
                                )}
                            >
                                <item.Icon
                                    className={cn(
                                        'size-5',
                                        active
                                            ? 'text-accent-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                />
                                {showUnreadBadge ? (
                                    <UnreadCountBadge
                                        count={friendsBadge}
                                        size="md"
                                        className="absolute -right-0.5 -top-0.5"
                                    />
                                ) : null}
                            </div>
                            <span
                                className={cn(
                                    'text-[10px] leading-tight',
                                    active ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'
                                )}
                            >
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}

export { BottomNav }
