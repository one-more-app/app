import { Home, LayoutGrid, Settings } from 'lucide-react'
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
        { to: '/stats', label: 'Stats', Icon: LayoutGrid },
        { to: '/settings', label: UI.settings, Icon: Settings },
    ]

function BottomNav() {
    const location = useLocation()
    const activeTo = location.pathname

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
            aria-label="Navigation"
        >
            <div className="mx-auto flex h-16 max-w-2xl items-center justify-around px-4">
                {NAV_ITEMS.map((item) => {
                    const active = activeTo === item.to
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'flex flex-1 flex-col items-center justify-center gap-1 text-center rounded-md outline-none transition-transform active:scale-[0.97]',
                                'transition-colors'
                            )}
                        >
                            <item.Icon
                                className={cn(
                                    'size-5',
                                    active ? 'text-default' : 'text-muted-foreground'
                                )}
                            />
                            <span
                                className={cn(
                                    'text-[11px] leading-none',
                                    active ? 'text-primary' : 'text-muted-foreground'
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

