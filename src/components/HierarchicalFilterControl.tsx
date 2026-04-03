import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

export type HierarchicalSelection = Record<string, 'all' | string[]>

function cloneSel(s: HierarchicalSelection): HierarchicalSelection {
    const out: HierarchicalSelection = {}
    for (const [k, v] of Object.entries(s)) out[k] = v === 'all' ? 'all' : [...v]
    return out
}

/** Valeurs du ToggleGroup enfants : en mode `all`, tout afficher comme coché (comportement inchangé côté données). */
function selectedChildren(
    sel: HierarchicalSelection[string] | undefined,
    groupChildren: string[],
): string[] {
    if (!sel) return []
    if (sel === 'all') return [...groupChildren]
    return [...sel]
}

/** États visuels communs : sélectionné = primary plein ; inactif = fond discret + bordure lisible */
const chipInactive =
    'bg-card text-foreground hover:bg-card/70'
const chipActive =
    'bg-primary text-primary-foreground hover:bg-primary/90 hover:border-primary'
const chipActiveInnerHover = 'hover:bg-primary/85 hover:text-primary-foreground'

const chipInactiveInnerHover = 'hover:bg-card/70'

interface HierarchicalFilterControlProps {
    title: string
    selection: HierarchicalSelection
    onChange: (next: HierarchicalSelection) => void
    groups: string[]
    byGroup: Record<string, string[]>
    isSelectionEmpty: (sel: HierarchicalSelection) => boolean
    allLabel: string
    renderAllIcon?: ReactNode
    /** Contenu à droite du titre ; utiliser `clearAll` pour fermer aussi le panneau enfants */
    renderHeaderActions?: (ctx: { clearAll: () => void }) => ReactNode
    translateGroup: (group: string) => string
    translateChild: (child: string) => string
    renderGroupIcon?: (group: string, active: boolean) => ReactNode
    className?: string
}

export function HierarchicalFilterControl({
    title,
    selection,
    onChange,
    groups,
    byGroup,
    isSelectionEmpty,
    allLabel,
    renderAllIcon,
    renderHeaderActions,
    translateGroup,
    translateChild,
    renderGroupIcon,
    className,
}: HierarchicalFilterControlProps) {
    const rootRef = useRef<HTMLDivElement | null>(null)
    const [openGroup, setOpenGroup] = useState<string | null>(null)

    const resolvedOpenGroup = useMemo(() => {
        if (!openGroup) return null
        if (selection[openGroup] !== undefined) return openGroup
        if (Object.keys(selection).length === 0) return openGroup
        return null
    }, [openGroup, selection])

    useEffect(() => {
        if (!resolvedOpenGroup) return
        const onPointerDown = (event: MouseEvent | TouchEvent) => {
            const target = event.target
            if (!(target instanceof Node)) return
            if (rootRef.current?.contains(target)) return
            setOpenGroup(null)
        }
        document.addEventListener('mousedown', onPointerDown)
        document.addEventListener('touchstart', onPointerDown, { passive: true })
        return () => {
            document.removeEventListener('mousedown', onPointerDown)
            document.removeEventListener('touchstart', onPointerDown)
        }
    }, [resolvedOpenGroup])

    const setGroupAll = (group: string, checked: boolean) => {
        const next = cloneSel(selection)
        if (checked) next[group] = 'all'
        else delete next[group]
        onChange(next)
    }

    const setGroupFromToggleValues = (group: string, values: string[]) => {
        const children = byGroup[group] ?? []
        const next = cloneSel(selection)
        if (values.length === 0) delete next[group]
        else if (values.length >= children.length) next[group] = 'all'
        else next[group] = [...values].sort((a, b) => a.localeCompare(b))
        onChange(next)
    }

    const badgeLabel = (group: string): string | null => {
        const children = byGroup[group] ?? []
        const sel = selection[group]
        if (!sel || children.length === 0) return null
        if (sel === 'all') return 'Tous'
        return `${sel.length}/${children.length}`
    }

    const clearAll = () => {
        onChange({})
        setOpenGroup(null)
    }

    return (
        <div ref={rootRef} className={cn('w-full min-w-0 space-y-1.5', className)}>
            <div className="flex items-center justify-between gap-2">
                <Label className="text-foreground text-xs">{title}</Label>
                {renderHeaderActions?.({ clearAll })}
            </div>
            <div
                className={cn(
                    'flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none]',
                    '[&::-webkit-scrollbar]:hidden',
                )}
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                <Button
                    type="button"
                    className={cn(
                        'h-9 transition-colors',
                        isSelectionEmpty(selection)
                            ? chipActive
                            : cn(
                                chipInactive,
                                'text-foreground hover:text-foreground',
                            ),
                    )}
                    onClick={clearAll}
                >
                    {renderAllIcon}
                    <span className="line-clamp-2 text-center">{allLabel}</span>
                </Button>

                {groups.map((group) => {
                    const children = byGroup[group] ?? []
                    if (children.length === 0) return null
                    const isActive = Boolean(selection[group])
                    const isOpen = resolvedOpenGroup === group
                    const badge = badgeLabel(group)

                    if (children.length === 1) {
                        return (
                            <Toggle
                                key={group}
                                pressed={isActive}
                                onPressedChange={(checked) => setGroupAll(group, checked)}
                                className={cn(
                                    'h-9 min-h-9 shrink-0 gap-2 rounded-lg  transition-colors',
                                    'data-[state=off]:bg-card data-[state=off]:text-foreground',
                                    'data-[state=off]:hover:bg-card/70',
                                    'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
                                    'data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:border-primary',
                                    !isActive &&
                                    'text-foreground data-[state=off]:text-foreground data-[state=off]:hover:text-foreground',
                                )}
                                aria-label={translateGroup(group)}
                            >
                                {renderGroupIcon?.(group, isActive)}
                                <span className="line-clamp-2 text-center">
                                    {translateGroup(group)}
                                </span>
                            </Toggle>
                        )
                    }

                    if (!isOpen) {
                        return (
                            <div
                                key={group}
                                role="group"
                                aria-label={translateGroup(group)}
                                className={cn(
                                    'flex h-9 shrink-0 items-stretch overflow-hidden rounded-lg transition-colors',
                                    isActive ? chipActive : chipInactive,
                                )}
                            >
                                <Button
                                    type="button"
                                    className={cn(
                                        'h-9 min-h-9 flex-1 shrink rounded-none border-0 px-2 shadow-none gap-2',
                                        isActive
                                            ? cn(
                                                'bg-transparent text-primary-foreground',
                                                chipActiveInnerHover,
                                            )
                                            : cn(
                                                'bg-transparent text-foreground',
                                                chipInactiveInnerHover,
                                            ),
                                    )}
                                    onClick={() =>
                                        setGroupAll(group, !isActive)
                                    }
                                    aria-pressed={isActive}
                                    aria-expanded={false}
                                >
                                    {renderGroupIcon?.(group, isActive)}
                                    <span className="line-clamp-2 text-center">
                                        {translateGroup(group)}
                                    </span>
                                    {badge ? (
                                        <span
                                            className={cn(
                                                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums',
                                                isActive
                                                    ? 'bg-primary-foreground/22 text-primary-foreground'
                                                    : 'bg-foreground/10 text-foreground',
                                            )}
                                        >
                                            {badge}
                                        </span>
                                    ) : null}
                                </Button>
                                <span
                                    className={cn(
                                        'w-px shrink-0 self-stretch my-1',
                                        isActive
                                            ? 'bg-primary-foreground/30'
                                            : 'bg-card/20',
                                    )}
                                    aria-hidden
                                />
                                <Button
                                    type="button"
                                    size="icon"
                                    className={cn(
                                        'h-9 w-9 shrink-0 rounded-none border-0 shadow-none',
                                        isActive
                                            ? cn(
                                                'bg-transparent text-primary-foreground',
                                                chipActiveInnerHover,
                                            )
                                            : cn(
                                                'bg-transparent text-foreground',
                                                chipInactiveInnerHover,
                                            ),
                                    )}
                                    aria-label={`${translateGroup(group)} — affiner`}
                                    onClick={() => setOpenGroup(group)}
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        )
                    }

                    return (
                        <div
                            key={group}
                            className={cn(
                                'flex w-max shrink-0 items-center rounded-xl',
                            )}
                            role="group"
                            aria-label={translateGroup(group)}
                        >
                            <Button
                                type="button"
                                variant="secondary"
                                className={cn(
                                    ' bg-primary text-primary-foreground shadow-none hover:bg-primary/90',
                                )}
                                onClick={() => setOpenGroup(null)}
                                aria-expanded
                            >
                                {renderGroupIcon?.(group, true)}
                                <span className="line-clamp-2 text-center">
                                    {translateGroup(group)}
                                </span>
                            </Button>
                            <ToggleGroup
                                type="multiple"
                                variant="outline"
                                value={selectedChildren(
                                    selection[group],
                                    children,
                                )}
                                onValueChange={(v) =>
                                    setGroupFromToggleValues(group, v)
                                }
                                className="flex max-w-[min(100vw-2rem,28rem)] flex-nowrap gap-1 overflow-x-auto -ml-2 rounded-lg rounded-l-none bg-card/90 p-1 pl-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                            >
                                {children.map((child) => (
                                    <ToggleGroupItem
                                        key={child}
                                        value={child}
                                        className={cn(
                                            'h-7 shrink-0 border transition-colors',
                                            'data-[state=off]:border-border/80 data-[state=off]:bg-card data-[state=off]:text-foreground data-[state=off]:hover:bg-card/70',
                                            'data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90',
                                        )}
                                        aria-label={translateChild(child)}
                                    >
                                        <span className="line-clamp-3 text-center font-medium">
                                            {translateChild(child)}
                                        </span>
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
