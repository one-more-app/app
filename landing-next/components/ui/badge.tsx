import { cn } from "@/lib/utils";
import * as React from "react";

function Badge({
    className,
    variant = "secondary",
    ...props
}: React.ComponentProps<"span"> & {
    variant?: "secondary" | "outline" | string;
}) {
    return (
        <span
            data-slot="badge"
            className={cn(
                "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium shrink-0",
                variant === "secondary" && "border-transparent bg-secondary text-secondary-foreground",
                variant === "outline" && "border-border text-foreground",
                className
            )}
            {...props}
        />
    );
}

export { Badge };
