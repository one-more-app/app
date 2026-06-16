import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AnalyticsEvents, track } from '@/lib/analytics'
import { hapticImpact, hapticSelectionChanged } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const ITEM_WIDTH = 56
const PADDING = ITEM_WIDTH * 2 // moitié visible de chaque côté

interface HorizontalWheelPickerProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    step?: number
    label: string
    unit?: string
    className?: string
}

function buildOptions(min: number, max: number, step: number) {
    const options: { value: number; label: string }[] = []
    const count = Math.round((max - min) / step) + 1
    for (let i = 0; i < count; i++) {
        const v = Number((min + i * step).toFixed(step < 1 ? 1 : 0))
        if (v > max) break
        options.push({
            value: v,
            label: step < 1 ? v.toFixed(1) : String(Math.round(v)),
        })
    }
    return options
}

function findClosestIndex(options: { value: number }[], value: number): number {
    if (options.length === 0) return 0
    const exact = options.findIndex((o) => o.value === value)
    if (exact >= 0) return exact
    return options.reduce((best, o, i) =>
        Math.abs(o.value - value) < Math.abs(options[best].value - value) ? i : best
        , 0)
}

export function HorizontalWheelPicker({
    value,
    onChange,
    min = 0,
    max = 999,
    step = 1,
    label,
    unit = '',
    className,
}: HorizontalWheelPickerProps) {
    const options = useMemo(() => buildOptions(min, max, step), [min, max, step])

    const emitChange = useCallback(
        (newValue: number, source: 'scroll' | 'button' | 'input') => {
            if (newValue === value) return
            track(AnalyticsEvents.WHEEL_PICKER_CHANGED, {
                picker_label: label,
                value: newValue,
                unit: unit || undefined,
                source,
            })
            onChange(newValue)
        },
        [value, onChange, label, unit],
    )
    const scrollRef = useRef<HTMLDivElement>(null)
    const isInternalUpdate = useRef(false)
    const isReady = useRef(false)

    const index = useMemo(() => findClosestIndex(options, value), [options, value])
    const clampedIndex = Math.max(0, Math.min(index, options.length - 1))

    const scrollToIndex = useCallback((targetIndex: number, smooth = false) => {
        const el = scrollRef.current
        if (!el || el.offsetWidth === 0) return
        const target = Math.max(0, Math.min(targetIndex, options.length - 1))
        const offset = PADDING + target * ITEM_WIDTH - el.offsetWidth / 2 + ITEM_WIDTH / 2
        isInternalUpdate.current = true
        isReady.current = true
        if (smooth) {
            el.scrollTo({ left: offset, behavior: 'smooth' })
        } else {
            el.scrollLeft = offset
        }
        setTimeout(() => {
            isInternalUpdate.current = false
        }, smooth ? 400 : 100)
    }, [options.length])

    const [isDragging, setIsDragging] = useState(false)
    const [inputText, setInputText] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const parseAndClamp = useCallback(
        (raw: string): number => {
            const parsed = parseFloat(raw.replace(',', '.'))
            if (Number.isNaN(parsed)) return value
            const clamped = Math.max(min, Math.min(max, parsed))
            // En saisie manuelle on accepte toute valeur dans [min, max], pas seulement les valeurs du step
            const decimals = step < 1 ? 1 : 0
            return Number(clamped.toFixed(decimals))
        },
        [min, max, step, value]
    )

    const commitInput = useCallback(() => {
        if (inputText === null) return
        const newValue = parseAndClamp(inputText)
        setInputText(null)
        if (newValue !== value) {
            emitChange(newValue, 'input')
            hapticImpact()
        }
    }, [inputText, parseAndClamp, value, emitChange])

    const handleInputKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault()
                inputRef.current?.blur()
            }
        },
        []
    )

    const handleInputFocus = useCallback(() => {
        const str = step < 1 ? value.toFixed(1) : String(Math.round(value))
        setInputText(str)
        requestAnimationFrame(() => inputRef.current?.select())
    }, [value, step])

    const syncToValue = useCallback(() => {
        if (!isDragging) scrollToIndex(clampedIndex)
    }, [clampedIndex, scrollToIndex, isDragging])

    useEffect(() => {
        syncToValue()
    }, [syncToValue])

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        const ro = new ResizeObserver(syncToValue)
        ro.observe(el)
        return () => ro.disconnect()
    }, [syncToValue])

    const handleScroll = useCallback(() => {
        const el = scrollRef.current
        if (!el || options.length === 0 || el.offsetWidth === 0 || isInternalUpdate.current || !isReady.current) {
            return
        }
        const center = el.scrollLeft + el.offsetWidth / 2
        const i = Math.round((center - PADDING - ITEM_WIDTH / 2) / ITEM_WIDTH)
        const clamped = Math.max(0, Math.min(i, options.length - 1))
        const newValue = options[clamped]?.value
        if (newValue !== undefined && newValue !== value) {
            emitChange(newValue, 'scroll')
            hapticSelectionChanged()
        }
    }, [options, value, emitChange])

    const handleDecrement = useCallback(() => {
        const next = Math.max(0, clampedIndex - 1)
        scrollToIndex(next, true)
        emitChange(options[next]!.value, 'button')
        hapticImpact()
    }, [clampedIndex, options, emitChange, scrollToIndex])

    const handleIncrement = useCallback(() => {
        const next = Math.min(options.length - 1, clampedIndex + 1)
        scrollToIndex(next, true)
        emitChange(options[next]!.value, 'button')
        hapticImpact()
    }, [clampedIndex, options, emitChange, scrollToIndex])

    useEffect(() => {
        if (document.activeElement === inputRef.current) {
            setInputText(step < 1 ? value.toFixed(1) : String(Math.round(value)))
        } else {
            setInputText(null)
        }
    }, [value, step])

    useEffect(() => {
        const onMouseUp = () => setIsDragging(false)
        window.addEventListener('mouseup', onMouseUp)
        return () => window.removeEventListener('mouseup', onMouseUp)
    }, [])

    return (
        <div className={cn('flex flex-col items-center gap-2', className)}>
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <div className="flex w-full flex-col items-center gap-1">
                <div className="flex w-full items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-10 shrink-0 rounded-full sm:size-11"
                        onClick={handleDecrement}
                        disabled={clampedIndex <= 0}
                    >
                        <Minus className="size-4 sm:size-5" />
                    </Button>
                    <div className="relative min-w-0 flex-1 font-one-more">
                        <div
                            ref={scrollRef}
                            className="flex h-14 w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)] [&::-webkit-scrollbar]:hidden"
                            style={{
                                scrollSnapType: 'x mandatory',
                                WebkitOverflowScrolling: 'touch',
                            }}
                            onScroll={handleScroll}
                            onTouchStart={() => setIsDragging(true)}
                            onTouchEnd={() => setIsDragging(false)}
                            onMouseDown={() => setIsDragging(true)}
                        >
                            <div className="shrink-0" style={{ width: PADDING }} />
                            {options.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={cn(
                                        'flex shrink-0 items-center justify-center font-semibold tabular-nums',
                                        opt.value === value ? 'text-transparent text-xl' : 'text-muted-foreground/50 text-base'
                                    )}
                                    style={{ width: ITEM_WIDTH, height: 56, scrollSnapAlign: 'center' }}
                                >
                                    {opt.label}
                                </div>
                            ))}
                            <div className="shrink-0" style={{ width: PADDING }} />
                        </div>
                        <Input
                            ref={inputRef}
                            type="text"
                            inputMode="decimal"
                            className={cn(
                                'absolute left-1/2 top-0 z-20 h-14 -translate-x-1/2 px-0 py-0 text-center text-xl font-semibold tabular-nums leading-[3.5rem]',
                                'border-0 bg-transparent shadow-none focus-visible:border focus-visible:bg-background focus-visible:ring-2'
                            )}
                            style={{ width: ITEM_WIDTH }}
                            value={inputText ?? (step < 1 ? value.toFixed(1) : String(Math.round(value)))}
                            onChange={(e) => setInputText(e.target.value)}
                            onBlur={commitInput}
                            onFocus={handleInputFocus}
                            onKeyDown={handleInputKeyDown}
                            aria-label={label}
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-10 shrink-0 rounded-full sm:size-11"
                        onClick={handleIncrement}
                        disabled={clampedIndex >= options.length - 1}
                    >
                        <Plus className="size-4 sm:size-5" />
                    </Button>
                </div>
                {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
            </div>
        </div>
    )
}
