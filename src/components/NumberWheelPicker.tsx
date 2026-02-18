import { hapticSelectionChanged } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import { useEffect, useMemo, useRef } from 'react'
import {
    WheelPicker,
    WheelPickerWrapper,
    type WheelPickerOption,
} from '@/components/wheel-picker/wheel-picker'

interface NumberWheelPickerProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    step?: number
    label: string
    unit?: string
    className?: string
}

function buildOptions(min: number, max: number, step: number): WheelPickerOption<number>[] {
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

export function NumberWheelPicker({
    value,
    onChange,
    min = 0,
    max = 999,
    step = 1,
    label,
    unit = '',
    className,
}: NumberWheelPickerProps) {
    const lastHapticValue = useRef(value)

    useEffect(() => {
        lastHapticValue.current = value
    }, [value])

    const options = useMemo(
        () => buildOptions(min, max, step),
        [min, max, step]
    )

    const handleValueChange = (v: number) => {
        onChange(v)
        if (v !== lastHapticValue.current) {
            lastHapticValue.current = v
            hapticSelectionChanged()
        }
    }

    const VIEWPORT_W = 224
    const VIEWPORT_H = 56
    const WHEEL_W = VIEWPORT_H
    const WHEEL_H = VIEWPORT_W

    return (
        <div className={cn('flex flex-col items-center gap-2', className)}>
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <div className="flex w-full flex-col items-center gap-1">
                {/* Viewport bande horizontale : drag gauche↔droite pour changer la valeur */}
                <div
                    className="relative overflow-hidden"
                    style={{ width: VIEWPORT_W, height: VIEWPORT_H }}
                >
                    <div
                        className="absolute will-change-transform"
                        style={{
                            left: '50%',
                            top: '50%',
                            width: WHEEL_W,
                            height: WHEEL_H,
                            transform: 'translate(-50%, -50%) rotate(-90deg)',
                            transformOrigin: 'center center',
                        }}
                    >
                        <WheelPickerWrapper
                            className="!flex shrink-0"
                            style={{ width: WHEEL_W, height: WHEEL_H, minWidth: WHEEL_W, minHeight: WHEEL_H }}
                        >
                            <WheelPicker<number>
                                options={options}
                                value={value}
                                onValueChange={handleValueChange}
                                optionItemHeight={VIEWPORT_H}
                                visibleCount={4}
                            />
                        </WheelPickerWrapper>
                    </div>
                </div>
                {unit && (
                    <span className="text-xs text-muted-foreground">{unit}</span>
                )}
            </div>
        </div>
    )
}
