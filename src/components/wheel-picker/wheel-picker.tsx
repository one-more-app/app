import "@ncdai/react-wheel-picker/style.css"

import * as WheelPickerPrimitive from "@ncdai/react-wheel-picker"

import { cn } from "@/lib/utils"

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

function WheelPicker<T extends WheelPickerValue = string>({
  classNames,
  ...props
}: WheelPickerPrimitive.WheelPickerProps<T>) {
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
      {...props}
    />
  )
}

export { WheelPicker, WheelPickerWrapper }
export type { WheelPickerClassNames, WheelPickerOption }
