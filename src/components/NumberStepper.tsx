import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

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
    const [inputValue, setInputValue] = useState(String(value))

    useEffect(() => {
        setInputValue(String(value))
    }, [value])

    const commitValue = (raw: string) => {
        const parsed = step < 1 ? parseFloat(raw) : parseInt(raw, 10)
        if (!Number.isNaN(parsed)) {
            const clamped = Math.min(max, Math.max(min, parsed))
            const rounded = Number(Number(clamped).toFixed(step < 1 ? 1 : 0))
            onChange(rounded)
            setInputValue(String(rounded))
        } else {
            setInputValue(String(value))
        }
    }

    const handleIncrement = () => {
        const next = Math.min(max, value + step)
        onChange(Number(Number(next).toFixed(step < 1 ? 1 : 0)))
    }

    const handleDecrement = () => {
        const next = Math.max(min, value - step)
        onChange(Number(Number(next).toFixed(step < 1 ? 1 : 0)))
    }

    return (
        <div className={cn('flex flex-col items-center gap-2', className)}>
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <div className="flex items-center justify-between gap-2 w-full">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-12 rounded-full shrink-0"
                    onClick={handleDecrement}
                    disabled={value <= min}
                >
                    <Minus className="size-5" />
                </Button>
                <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
                    <Input
                        type="number"
                        inputMode="decimal"
                        min={min}
                        max={max}
                        step={step}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={(e) => commitValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        className="h-12 w-full max-w-[5rem] text-center text-xl font-bold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    {unit && (
                        <span className="shrink-0 text-muted-foreground text-sm">{unit}</span>
                    )}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10 shrink-0 rounded-full sm:size-12"
                    onClick={handleIncrement}
                    disabled={value >= max}
                >
                    <Plus className="size-5" />
                </Button>
            </div>
        </div>
    )
}
