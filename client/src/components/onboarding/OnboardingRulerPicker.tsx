import {
    hapticImpact,
    primeHaptics,
} from '@/lib/haptics'
import { cn } from '@/lib/utils'
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

const ITEM_WIDTH = 12
/** Hauteur réservée au chiffre hero (text-5xl / sm:text-6xl + unité). */
const VALUE_SLOT_H = '4.5rem'
/** Zone visuelle des crans + labels. */
const RULER_SLOT_H_PX = 80
const RULER_SLOT_H = `${RULER_SLOT_H_PX}px`
/** Fin de geste / inertie : après ça on peut re-sync depuis la value externe. */
const SCROLL_IDLE_MS = 140

interface OnboardingRulerPickerProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    step?: number
    unit?: string
    className?: string
}

function buildOptions(min: number, max: number, step: number) {
    const options: number[] = []
    const count = Math.round((max - min) / step) + 1
    for (let i = 0; i < count; i++) {
        const v = Number((min + i * step).toFixed(step < 1 ? 1 : 0))
        if (v > max) break
        options.push(v)
    }
    return options
}

function findClosestIndex(options: number[], value: number): number {
    if (options.length === 0) return 0
    const exact = options.findIndex((o) => o === value)
    if (exact >= 0) return exact
    return options.reduce(
        (best, o, i) =>
            Math.abs(o - value) < Math.abs(options[best] - value) ? i : best,
        0,
    )
}

function indexFromScroll(
    scrollLeft: number,
    offsetWidth: number,
    padding: number,
    optionCount: number,
): number {
    const center = scrollLeft + offsetWidth / 2
    const i = Math.round((center - padding - ITEM_WIDTH / 2) / ITEM_WIDTH)
    return Math.max(0, Math.min(i, optionCount - 1))
}

function scrollLeftForIndex(
    index: number,
    offsetWidth: number,
    padding: number,
): number {
    return padding + index * ITEM_WIDTH - offsetWidth / 2 + ITEM_WIDTH / 2
}

function formatValue(value: number, step: number) {
    return step < 1 ? value.toFixed(1) : String(Math.round(value))
}

function drawTicks(
    canvas: HTMLCanvasElement,
    optionCount: number,
    min: number,
    step: number,
) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cssWidth = optionCount * ITEM_WIDTH
    const cssHeight = RULER_SLOT_H_PX
    const pixelW = Math.round(cssWidth * dpr)
    const pixelH = Math.round(cssHeight * dpr)
    if (canvas.width !== pixelW || canvas.height !== pixelH) {
        canvas.width = pixelW
        canvas.height = pixelH
        canvas.style.width = `${cssWidth}px`
        canvas.style.height = `${cssHeight}px`
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, cssWidth, cssHeight)

    const color = getComputedStyle(canvas).color || 'rgb(255,255,255)'

    for (let i = 0; i < optionCount; i++) {
        const valueTenths = Math.round((min + i * step) * 10)
        const isMajor = valueTenths % 10 === 0
        const x = i * ITEM_WIDTH + ITEM_WIDTH / 2
        const h = isMajor ? 32 : 16
        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.globalAlpha = isMajor ? 0.7 : 0.4
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.moveTo(x, 4)
        ctx.lineTo(x, 4 + h)
        ctx.stroke()
    }
    ctx.globalAlpha = 1
}

export function OnboardingRulerPicker({
    value,
    onChange,
    min = 30,
    max = 300,
    step = 0.1,
    unit = 'kg',
    className,
}: OnboardingRulerPickerProps) {
    const options = useMemo(() => buildOptions(min, max, step), [min, max, step])
    const scrollRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const displayRef = useRef<HTMLSpanElement>(null)
    const paddingRef = useRef(160)
    const [padding, setPadding] = useState(160)

    const ignoreScrollRef = useRef(false)
    const isScrollingRef = useRef(false)
    const scrollIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastHapticIndex = useRef(-1)
    const valueRef = useRef(value)
    const onChangeRef = useRef(onChange)
    const pendingValueRef = useRef(value)
    const rafEmitRef = useRef<number | null>(null)

    valueRef.current = value
    onChangeRef.current = onChange

    const targetIndex = useMemo(
        () => findClosestIndex(options, value),
        [options, value],
    )

    const majorLabels = useMemo(() => {
        const labels: { kg: number; left: number }[] = []
        for (let i = 0; i < options.length; i++) {
            const option = options[i]
            if (Math.round(option * 10) % 10 !== 0) continue
            labels.push({
                kg: Math.round(option),
                left: i * ITEM_WIDTH + ITEM_WIDTH / 2,
            })
        }
        return labels
    }, [options])

    const trackWidth = options.length * ITEM_WIDTH

    const setDisplayText = useCallback(
        (next: number) => {
            const el = displayRef.current
            if (el) el.textContent = formatValue(next, step)
        },
        [step],
    )

    useEffect(() => {
        primeHaptics()
    }, [])

    useEffect(() => {
        return () => {
            if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current)
            if (rafEmitRef.current != null) cancelAnimationFrame(rafEmitRef.current)
        }
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || options.length === 0) return
        drawTicks(canvas, options.length, min, step)
    }, [options.length, min, step])

    useEffect(() => {
        if (isScrollingRef.current) return
        pendingValueRef.current = value
        setDisplayText(value)
    }, [value, setDisplayText])

    const applyScrollToIndex = useCallback(
        (index: number) => {
            const el = scrollRef.current
            if (!el || el.offsetWidth === 0 || options.length === 0) return
            const clamped = Math.max(0, Math.min(index, options.length - 1))
            const nextLeft = scrollLeftForIndex(
                clamped,
                el.offsetWidth,
                paddingRef.current,
            )
            if (Math.abs(el.scrollLeft - nextLeft) < 0.5) return

            ignoreScrollRef.current = true
            lastHapticIndex.current = clamped
            el.scrollLeft = nextLeft
            requestAnimationFrame(() => {
                ignoreScrollRef.current = false
            })
        },
        [options.length],
    )

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return

        const updatePadding = () => {
            if (el.offsetWidth === 0) return
            const next = Math.max(0, el.offsetWidth / 2 - ITEM_WIDTH / 2)
            if (Math.abs(next - paddingRef.current) < 0.5) return
            paddingRef.current = next
            setPadding(next)
        }

        updatePadding()
        const ro = new ResizeObserver(updatePadding)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    useLayoutEffect(() => {
        paddingRef.current = padding
        if (isScrollingRef.current) return
        applyScrollToIndex(findClosestIndex(options, valueRef.current))
    }, [padding, applyScrollToIndex, options])

    useEffect(() => {
        if (isScrollingRef.current) return
        applyScrollToIndex(targetIndex)
    }, [targetIndex, applyScrollToIndex])

    const emitValue = useCallback((next: number) => {
        pendingValueRef.current = next
        if (rafEmitRef.current != null) return
        rafEmitRef.current = requestAnimationFrame(() => {
            rafEmitRef.current = null
            const v = pendingValueRef.current
            if (v !== valueRef.current) {
                onChangeRef.current(v)
            }
        })
    }, [])

    const handleScroll = useCallback(() => {
        const el = scrollRef.current
        if (!el || options.length === 0 || el.offsetWidth === 0) return
        if (ignoreScrollRef.current) return

        isScrollingRef.current = true
        if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current)
        scrollIdleTimerRef.current = setTimeout(() => {
            isScrollingRef.current = false
            applyScrollToIndex(findClosestIndex(options, pendingValueRef.current))
            if (pendingValueRef.current !== valueRef.current) {
                onChangeRef.current(pendingValueRef.current)
            }
        }, SCROLL_IDLE_MS)

        const i = indexFromScroll(
            el.scrollLeft,
            el.offsetWidth,
            paddingRef.current,
            options.length,
        )

        if (i !== lastHapticIndex.current) {
            lastHapticIndex.current = i
            void hapticImpact()
        }

        const newValue = options[i]
        if (newValue === undefined) return

        setDisplayText(newValue)
        emitValue(newValue)
    }, [options, applyScrollToIndex, emitValue, setDisplayText])

    return (
        <div
            className={cn(
                'relative mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col',
                className,
            )}
        >
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="absolute inset-0 touch-pan-x overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {/* Même grille verticale que l’overlay (valeur + gap + règle) pour aligner le curseur. */}
                <div className="flex h-full min-w-full flex-col items-stretch justify-center gap-8">
                    <div className="shrink-0" style={{ height: VALUE_SLOT_H }} aria-hidden />
                    <div className="flex shrink-0" style={{ height: RULER_SLOT_H }}>
                        <div className="h-full shrink-0" style={{ width: padding }} aria-hidden />
                        <div
                            className="relative shrink-0"
                            style={{ width: trackWidth, height: RULER_SLOT_H }}
                        >
                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0 text-foreground"
                                aria-hidden
                            />
                            {majorLabels.map(({ kg, left }) => (
                                <span
                                    key={kg}
                                    className="absolute top-10 -translate-x-1/2 text-[10px] tabular-nums text-muted-foreground"
                                    style={{ left }}
                                >
                                    {kg}
                                </span>
                            ))}
                        </div>
                        <div className="h-full shrink-0" style={{ width: padding }} aria-hidden />
                    </div>
                </div>
            </div>

            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-8">
                <p
                    className="flex shrink-0 items-center justify-center text-center"
                    style={{ height: VALUE_SLOT_H }}
                >
                    <span
                        ref={displayRef}
                        className="font-one-more text-5xl font-bold italic tabular-nums sm:text-6xl"
                    >
                        {formatValue(value, step)}
                    </span>
                    <span className="ml-2 text-lg text-muted-foreground">{unit}</span>
                </p>
                <div className="relative w-full shrink-0" style={{ height: RULER_SLOT_H }}>
                    {/* Curseur au-dessus des crans, comme avant. */}
                    <div
                        className="absolute inset-x-0 -top-1 flex justify-center"
                        aria-hidden
                    >
                        <div className="h-10 w-0.5 rounded-full bg-white shadow-sm ring-1 ring-foreground/20 dark:bg-accent dark:shadow-none dark:ring-0" />
                    </div>
                </div>
            </div>
        </div>
    )
}
