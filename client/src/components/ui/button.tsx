import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import * as React from "react"

import { triggerButtonHaptic } from "@/lib/haptics"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center cursor-pointer gap-2 whitespace-nowrap text-sm transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 will-change-transform [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                default:
                    "rounded-lg bg-primary dark:bg-primary-foreground text-[12px] text-primary-foreground dark:text-primary font-one-more uppercase tracking-wide hover:bg-primary/90",
                accent:
                    "rounded-lg bg-accent text-[12px] text-accent-foreground font-one-more uppercase tracking-wide hover:bg-accent/90 hover:text-accent-foreground",
                destructive:
                    "rounded-lg font-medium bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive/60",
                "outline-destructive":
                    "rounded-lg font-medium border border-destructive text-destructive hover:bg-destructive/10",
                outline:
                    "rounded-lg font-medium border bg-background hover:bg-secondary hover:text-secondary-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
                secondary:
                    "rounded-lg font-medium bg-secondary text-secondary-foreground hover:bg-secondary",
                ghost:
                    "rounded-lg font-medium hover:bg-secondary hover:text-secondary-foreground",
                link: "font-medium text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-9 px-4 py-1 has-[>svg]:px-3",
                xs: "h-6 gap-1 rounded-lg px-1 text-xs font-medium has-[>svg]:px-0.5 [&_svg:not([class*='size-'])]:size-3",
                sm: "h-7 gap-1.5 px-2.5 has-[>svg]:px-2",
                lg: "h-10 px-5 text-base has-[>svg]:px-4",
                icon: "size-9 rounded-lg",
                "icon-xs": "size-6 rounded-lg [&_svg:not([class*='size-'])]:size-3",
                "icon-sm": "size-7 rounded-lg",
                "icon-lg": "size-10 rounded-lg",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

function Button({
    className,
    variant = "default",
    size = "default",
    asChild = false,
    haptic = true,
    onClick,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean
        /** Désactive le retour haptique pour ce bouton */
        haptic?: boolean
    }) {
    const Comp = asChild ? Slot.Root : "button"

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (haptic) triggerButtonHaptic(variant)
        onClick?.(event)
    }

    return (
        <Comp
            data-slot="button"
            data-variant={variant}
            data-size={size}
            className={cn(buttonVariants({ variant, size, className }))}
            onClick={handleClick}
            {...props}
        />
    )
}

export { Button, buttonVariants }
