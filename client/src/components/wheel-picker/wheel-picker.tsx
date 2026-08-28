import "@ncdai/react-wheel-picker/style.css"

import * as WheelPickerPrimitive from "@ncdai/react-wheel-picker"
import { hapticSelectionChanged } from "@/lib/haptics"
import { cn } from "@/lib/utils"
import { useCallback, useEffect, useRef } from "react"

type WheelPickerValue = WheelPickerPrimitive.WheelPickerValue

type WheelPickerOption<T extends WheelPickerValue = string> =
    WheelPickerPrimitive.WheelPickerOption<T>

type WheelPickerClassNames = WheelPickerPrimitive.WheelPickerClassNames

function WheelPickerWrapper({
    className,
    ...props
}: React.ComponentProps<typeof WheelPickerPrimitive.WheelPickerWrapper>) {
    return (
        <WheelPickerPrimitive.WheelPickerWrapper
            className={cn(
                "rounded-lg border border-white/10 bg-background px-1",
                "*:data-rwp:first:*:data-rwp-highlight-wrapper:rounded-s-md",
                "*:data-rwp:last:*:data-rwp-highlight-wrapper:rounded-e-md",
                className
            )}
            {...props}
        />
    )
}

type WheelPickerProps<T extends WheelPickerValue = string> =
    WheelPickerPrimitive.WheelPickerProps<T> & {
        /** Retour haptique à chaque cran (défaut: true) */
        haptic?: boolean
    }

function WheelPicker<T extends WheelPickerValue = string>({
    classNames,
    haptic = true,
    onValueChange,
    value,
    defaultValue,
    ...props
}: WheelPickerProps<T>) {
    const lastHapticValue = useRef<T | undefined>(value ?? defaultValue)

    useEffect(() => {
        if (value !== undefined) {
            lastHapticValue.current = value
        }
    }, [value])

    const handleValueChange = useCallback(
        (next: T) => {
            onValueChange?.(next)
            if (haptic && next !== lastHapticValue.current) {
                lastHapticValue.current = next
                void hapticSelectionChanged()
            }
        },
        [haptic, onValueChange],
    )

    return (
        <WheelPickerPrimitive.WheelPicker
            classNames={{
                optionItem: cn(
                    "text-muted-foreground/60 data-disabled:opacity-40",
                    classNames?.optionItem
                ),
                highlightWrapper: cn(
                    "bg-muted/50 text-foreground border-y border-white/5",
                    "data-rwp-focused:ring-2 data-rwp-focused:ring-accent/50 data-rwp-focused:ring-inset",
                    classNames?.highlightWrapper
                ),
                highlightItem: cn(
                    "data-disabled:opacity-40 font-semibold tabular-nums",
                    classNames?.highlightItem
                ),
            }}
            value={value}
            defaultValue={defaultValue}
            onValueChange={handleValueChange}
            {...props}
        />
    )
}

export { WheelPicker, WheelPickerWrapper }
export type { WheelPickerClassNames, WheelPickerOption, WheelPickerProps }

