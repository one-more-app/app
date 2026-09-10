import {
    WheelPicker,
    WheelPickerWrapper,
    type WheelPickerOption,
} from '@/components/wheel-picker/wheel-picker'
import { primeHaptics } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import { useEffect, useMemo } from 'react'

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

    useEffect(() => {
        primeHaptics()
    }, [])

    return (
        <div
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
                        onValueChange={onChange}
                        optionItemHeight={OPTION_ITEM_HEIGHT}
                        visibleCount={VISIBLE_COUNT}
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
