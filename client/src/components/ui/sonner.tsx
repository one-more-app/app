import {
    CircleAlert,
    CircleCheck,
    Info,
    Loader2,
    TriangleAlert,
} from "lucide-react"
import * as React from "react"
import { Toaster as Sonner } from "sonner"

import { useTheme } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"

type ToasterProps = React.ComponentProps<typeof Sonner>

const TOAST_OFFSET = "calc(var(--safe-top) + 0.75rem)"

function ToastIcon({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <span
            className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md",
                className,
            )}
            aria-hidden
        >
            {children}
        </span>
    )
}

export function Toaster({ className, position, ...props }: ToasterProps) {
    const { resolvedTheme } = useTheme()

    return (
        <Sonner
            theme={resolvedTheme}
            className={cn("toaster group", className)}
            position={position ?? "top-center"}
            offset={{ top: TOAST_OFFSET }}
            mobileOffset={{ top: TOAST_OFFSET }}
            gap={6}
            icons={{
                success: (
                    <ToastIcon className="bg-accent">
                        <CircleCheck
                            className="size-3.5 text-accent-foreground"
                            strokeWidth={2.25}
                        />
                    </ToastIcon>
                ),
                error: (
                    <ToastIcon className="bg-destructive/15 dark:bg-destructive/25">
                        <CircleAlert
                            className="size-3.5 text-destructive"
                            strokeWidth={2.25}
                        />
                    </ToastIcon>
                ),
                warning: (
                    <ToastIcon className="bg-amber-500/15 dark:bg-amber-500/20">
                        <TriangleAlert
                            className="size-3.5 text-amber-700 dark:text-amber-400"
                            strokeWidth={2.25}
                        />
                    </ToastIcon>
                ),
                info: (
                    <ToastIcon className="bg-muted">
                        <Info
                            className="size-3.5 text-foreground"
                            strokeWidth={2.25}
                        />
                    </ToastIcon>
                ),
                loading: (
                    <ToastIcon className="bg-muted">
                        <Loader2
                            className="size-3.5 animate-spin text-muted-foreground"
                            strokeWidth={2.25}
                        />
                    </ToastIcon>
                ),
            }}
            toastOptions={{
                classNames: {
                    toast: cn(
                        "group toast",
                        "w-[min(100%,17rem)]",
                        "group-[.toaster]:border group-[.toaster]:border-border",
                        "group-[.toaster]:bg-card/95 group-[.toaster]:text-card-foreground",
                        "group-[.toaster]:backdrop-blur-md",
                        "group-[.toaster]:!rounded-xl group-[.toaster]:!px-3 group-[.toaster]:!py-2",
                        "group-[.toaster]:!shadow-sm group-[.toaster]:shadow-black/10",
                        "dark:group-[.toaster]:!shadow-md dark:group-[.toaster]:shadow-black/35",
                    ),
                    title: "group-[.toast]:text-xs group-[.toast]:font-semibold group-[.toast]:leading-tight",
                    description:
                        "group-[.toast]:text-[11px] group-[.toast]:leading-snug group-[.toast]:text-muted-foreground",
                    icon: "group-[.toast]:!mr-2 group-[.toast]:!size-auto",
                    actionButton:
                        "group-[.toast]:h-7 group-[.toast]:rounded-md group-[.toast]:px-2 group-[.toast]:text-xs group-[.toast]:bg-accent group-[.toast]:font-medium group-[.toast]:text-accent-foreground",
                    cancelButton:
                        "group-[.toast]:h-7 group-[.toast]:rounded-md group-[.toast]:px-2 group-[.toast]:text-xs group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                },
            }}
            {...props}
        />
    )
}
