import {
    WheelPicker,
    WheelPickerWrapper,
    type WheelPickerOption,
} from '@/components/wheel-picker/wheel-picker'
import {
    hapticImpact,
    primeHaptics,
} from '@/lib/haptics'
import { cn } from '@/lib/utils'
import { useCallback, useEffect, useMemo, useRef } from 'react'

const OPTION_ITEM_HEIGHT = 64
const VISIBLE_COUNT = 12

interface OnboardingVerticalWheelPickerProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    step?: number
    unit?: string
    className?: string
}

function buildOptions(
    min: number,
    max: number,
    step: number,
): WheelPickerOption<number>[] {
    const options: WheelPickerOption<number>[] = []
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

/**
 * Estime l’index courant depuis le translateY de la highlight-list
 * (mis à jour à chaque frame pendant le drag par @ncdai/react-wheel-picker).
 */
function readWheelIndex(root: HTMLElement, itemHeight: number): number | null {
    const list = root.querySelector<HTMLElement>('[data-rwp-highlight-list]')
    if (!list) return null
    const transform = list.style.transform || getComputedStyle(list).transform
    if (!transform || transform === 'none') return null

    let translateY = 0
    const cssMatch = /translateY\(\s*(-?[\d.]+)px\s*\)/.exec(transform)
    if (cssMatch) {
        translateY = Number(cssMatch[1])
    } else {
        const matrixMatch = /matrix\(([^)]+)\)/.exec(transform)
        if (!matrixMatch) return null
        const parts = matrixMatch[1].split(',').map((p) => Number(p.trim()))
        translateY = parts[5] ?? 0
    }

    if (!Number.isFinite(translateY) || itemHeight <= 0) return null
    return Math.round(-translateY / itemHeight)
}

export function OnboardingVerticalWheelPicker({
    value,
    onChange,
    min = 0,
    max = 999,
    step = 1,
    unit = '',
    className,
}: OnboardingVerticalWheelPickerProps) {
    const options = useMemo(
        () => buildOptions(min, max, step),
        [min, max, step],
    )
    const rootRef = useRef<HTMLDivElement>(null)
    const lastHapticIndexRef = useRef<number | null>(null)
    const gestureActiveRef = useRef(false)
    const gestureGenRef = useRef(0)
    const rafRef = useRef<number | null>(null)
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const onChangeRef = useRef(onChange)

    useEffect(() => {
        onChangeRef.current = onChange
    }, [onChange])

    const fireIndexHaptic = useCallback((index: number) => {
        if (lastHapticIndexRef.current === index) return
        lastHapticIndexRef.current = index
        void hapticImpact()
    }, [])

    const sampleIndex = useCallback(() => {
        const root = rootRef.current
        if (!root) return
        const index = readWheelIndex(root, OPTION_ITEM_HEIGHT)
        if (index == null) return
        const clamped = Math.max(0, Math.min(index, options.length - 1))
        fireIndexHaptic(clamped)
    }, [fireIndexHaptic, options.length])

    const stopSampling = useCallback(() => {
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
        gestureActiveRef.current = false
    }, [])

    const scheduleStopSampling = useCallback(
        (delayMs: number) => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
            const gen = gestureGenRef.current
            idleTimerRef.current = setTimeout(() => {
                if (gen !== gestureGenRef.current) return
                stopSampling()
                sampleIndex()
            }, delayMs)
        },
        [sampleIndex, stopSampling],
    )

    const startSampling = useCallback(() => {
        gestureGenRef.current += 1
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current)
            idleTimerRef.current = null
        }
        gestureActiveRef.current = true
        const loop = () => {
            sampleIndex()
            if (gestureActiveRef.current) {
                rafRef.current = requestAnimationFrame(loop)
            }
        }
        if (rafRef.current == null) {
            rafRef.current = requestAnimationFrame(loop)
        }
    }, [sampleIndex])

    useEffect(() => {
        primeHaptics()
        lastHapticIndexRef.current = findOptionIndex(options, value)
    }, [options, value])

    useEffect(() => {
        const el = rootRef.current
        if (!el) return

        const onPointerDown = (event: PointerEvent) => {
            if (event.button !== 0 && event.pointerType === 'mouse') return
            startSampling()
        }

        const onPointerUp = () => {
            sampleIndex()
            scheduleStopSampling(320)
        }

        const onWheel = () => {
            startSampling()
            sampleIndex()
            scheduleStopSampling(180)
        }

        el.addEventListener('pointerdown', onPointerDown)
        window.addEventListener('pointerup', onPointerUp)
        window.addEventListener('pointercancel', onPointerUp)
        el.addEventListener('wheel', onWheel, { passive: true })

        return () => {
            el.removeEventListener('pointerdown', onPointerDown)
            window.removeEventListener('pointerup', onPointerUp)
            window.removeEventListener('pointercancel', onPointerUp)
            el.removeEventListener('wheel', onWheel)
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
            stopSampling()
        }
    }, [sampleIndex, scheduleStopSampling, startSampling, stopSampling])

    const handleValueChange = useCallback(
        (next: number) => {
            const index = findOptionIndex(options, next)
            if (index >= 0) fireIndexHaptic(index)
            onChangeRef.current(next)
        },
        [fireIndexHaptic, options],
    )

    return (
        <div
            ref={rootRef}
            className={cn(
                'relative mx-auto flex min-h-0 w-full max-w-xs flex-1 flex-col',
                // Hitbox = tout le bloc : la roue s’étire, le rendu reste masqué aux bords.
                '[&_[data-rwp-wrapper]]:h-full [&_[data-rwp-wrapper]]:min-h-0',
                '[&_[data-rwp]]:!h-full',
                className,
            )}
        >
            <div className="absolute inset-0 flex min-h-0 items-center justify-center">
                <WheelPickerWrapper className="h-full w-full border-0 bg-transparent px-0">
                    <WheelPicker
                        options={options}
                        value={value}
                        onValueChange={handleValueChange}
                        optionItemHeight={OPTION_ITEM_HEIGHT}
                        visibleCount={VISIBLE_COUNT}
                        // Ticks cran-par-cran via sampling du transform.
                        haptic={false}
                        classNames={{
                            optionItem:
                                'text-base text-muted-foreground/50 font-one-more italic',
                            // Fond opaque : masque le petit chiffre de la liste derrière le hero.
                            highlightWrapper:
                                'bg-background border-y border-white/10',
                            highlightItem:
                                'font-one-more text-5xl font-bold italic tabular-nums text-foreground sm:text-6xl',
                        }}
                    />
                </WheelPickerWrapper>
            </div>

            {unit ? (
                <span
                    className="pointer-events-none absolute top-1/2 left-1/2 z-10 ml-[4.75rem] -translate-y-1/2 text-lg text-muted-foreground sm:ml-[5.5rem]"
                    aria-hidden
                >
                    {unit}
                </span>
            ) : null}
        </div>
    )
}

function findOptionIndex(
    options: WheelPickerOption<number>[],
    value: number,
): number {
    const exact = options.findIndex((o) => o.value === value)
    return exact >= 0 ? exact : 0
}
