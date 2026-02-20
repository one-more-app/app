import { cn } from "@/lib/utils";
import * as React from "react";

function Card({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cn(
                "flex flex-col gap-2 rounded-xl border border-border bg-card text-card-foreground shadow-sm",
                className
            )}
            {...props}
        />
    );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cn(
                "flex flex-row items-start gap-4 px-4 pt-4",
                className
            )}
            {...props}
        />
    );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cn("leading-none font-semibold truncate capitalize", className)}
            {...props}
        />
    );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            className={cn("p-4", className)}
            {...props}
        />
    );
}

export { Card, CardContent, CardHeader, CardTitle };

