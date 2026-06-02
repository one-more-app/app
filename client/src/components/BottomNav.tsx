import { History, Home, User, Users } from 'lucide-react'
import type { JSX } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { UI } from '@/lib/translations'
import { cn } from '@/lib/utils'

const NAV_ITEMS: Array<{
    to: string
    label: string
    Icon: (props: { className?: string }) => JSX.Element
}> = [
        { to: '/home', label: 'Accueil', Icon: Home },
        { to: '/profile', label: UI.profile, Icon: User },
        { to: '/history', label: UI.history, Icon: History },
        { to: '/friends', label: UI.friendsTitle, Icon: Users },
    ]

function BottomNav() {
    const location = useLocation()
    const activeTo = location.pathname

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card pl-[var(--safe-left)] pr-[var(--safe-right)] pb-[var(--safe-bottom)]"
            aria-label="Navigation"
        >
            <div className="mx-auto flex pt-2 max-w-2xl items-center justify-around px-4">
                {NAV_ITEMS.map((item) => {
                    const active = activeTo === item.to
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'flex flex-1 flex-col items-center justify-center gap-1 text-center rounded-lg outline-none transition-transform active:scale-[0.97]',
                                'transition-colors'
                            )}
                        >
                            <div className={cn('flex flex-col items-center justify-center gap-1 w-12 h-12', active ? 'bg-accent p-1 rounded-lg w-' : 'text-muted-foreground')}>
                                <item.Icon
                                    className={cn(
                                        'size-5',
                                        active ? 'text-accent-foreground' : 'text-muted-foreground'
                                    )}
                                />

                            </div>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}

export { BottomNav }

