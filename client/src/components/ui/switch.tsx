import { Switch as SwitchPrimitive } from "radix-ui"
import * as React from "react"

import { hapticSelectionChanged } from "@/lib/haptics"
import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  onCheckedChange,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-input/80",
        size === "sm" ? "h-5 w-9" : "h-6 w-11",
        className,
      )}
      onCheckedChange={(checked) => {
        void hapticSelectionChanged()
        onCheckedChange?.(checked)
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-sm ring-0 transition-transform data-[state=unchecked]:translate-x-0 dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary",
          size === "sm"
            ? "size-4 data-[state=checked]:translate-x-4"
            : "size-5 data-[state=checked]:translate-x-5",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
