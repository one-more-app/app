import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { hapticImpact, hapticSelectionChanged } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface NumberStepperProps {
    value: number
    onChange: (value: number) => void
    min?: number
    max?: number
    step?: number
    label: string
    unit?: string
    className?: string
}

export function NumberStepper({
    value,
    onChange,
    min = 0,
    max = 999,
    step = 1,
    label,
    unit = '',
    className,
}: NumberStepperProps) {
    const lastHapticValue = useRef(value)

    useEffect(() => {
        lastHapticValue.current = value
    }, [value])

    const formatValue = (v: number) =>
        Number(v).toFixed(step < 1 ? 1 : 0)

    const handleIncrement = () => {
        const next = Math.min(max, value + step)
        const rounded = Number(Number(next).toFixed(step < 1 ? 1 : 0))
        onChange(rounded)
        hapticImpact()
    }

    const handleDecrement = () => {
        const next = Math.max(min, value - step)
        const rounded = Number(Number(next).toFixed(step < 1 ? 1 : 0))
        onChange(rounded)
        hapticImpact()
    }

    const handleSliderChange = (v: number[]) => {
        const rounded = Number(Number(v[0]).toFixed(step < 1 ? 1 : 0))
        const clamped = Math.min(max, Math.max(min, rounded))
        onChange(clamped)
        if (clamped !== lastHapticValue.current) {
            lastHapticValue.current = clamped
            hapticSelectionChanged()
        }
    }

    return (
        <div className={cn('flex flex-col items-center gap-3', className)}>
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <div className="flex w-full flex-col items-center gap-3">
                {/* Retour visuel : valeur qui s'actualise en temps réel au glissement */}
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold tabular-nums tracking-tight">
                        {formatValue(value)}
                    </span>
                    {unit && (
                        <span className="text-muted-foreground text-sm">{unit}</span>
                    )}
                </div>
                <div className="flex w-full items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-10 shrink-0 rounded-full sm:size-11"
                        onClick={handleDecrement}
                        disabled={value <= min}
                    >
                        <Minus className="size-4 sm:size-5" />
                    </Button>
                    <div className="relative flex min-w-0 flex-1 flex-col gap-2">
                        {/* Graduations min / max sous la piste */}
                        <Slider
                            value={[value]}
                            min={min}
                            max={max}
                            step={step}
                            stepped
                            onValueChange={handleSliderChange}
                            className="w-full [&_[data-slot=slider-track]]:h-2.5 [&_[data-slot=slider-thumb]]:size-6 [&_[data-slot=slider-thumb]]:border-2"
                        />
                        <div className="flex justify-between px-0.5 text-[10px] text-muted-foreground tabular-nums">
                            <span>{formatValue(min)}</span>
                            <span>{formatValue(max)}</span>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-10 shrink-0 rounded-full sm:size-11"
                        onClick={handleIncrement}
                        disabled={value >= max}
                    >
                        <Plus className="size-4 sm:size-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
