import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                accent: "bg-accent text-accent-foreground hover:bg-accent/90",
                outline: "border border-border bg-transparent hover:bg-muted",
                ghost: "hover:bg-muted hover:text-foreground",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 px-6",
                icon: "size-9",
                "icon-lg": "size-11 rounded-full",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

function Button({
    className,
    variant,
    size,
    asChild,
    children,
    ...props
}: ButtonProps) {
    const classes = cn(buttonVariants({ variant, size, className }));

    if (asChild && React.isValidElement(children)) {
        const child = children as React.ReactElement<{ className?: string }>;
        return React.cloneElement(child, {
            className: cn(classes, child.props?.className),
        });
    }

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    );
}

// eslint-disable-next-line react-refresh/only-export-components -- buttonVariants is a CVA helper
export { Button, buttonVariants };
