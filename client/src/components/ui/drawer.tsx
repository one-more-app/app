import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { trackDrawerOpenChange } from "@/lib/analytics/overlay-tracking"
import { cn } from "@/lib/utils"

type DrawerProps = React.ComponentProps<typeof DrawerPrimitive.Root> & {
    "data-analytics-label"?: string
}

function Drawer({
    onOpenChange,
    "data-analytics-label": analyticsLabel,
    ...props
}: DrawerProps) {
    return (
        <DrawerPrimitive.Root
            data-slot="drawer"
            onOpenChange={(open) =>
                trackDrawerOpenChange(open, analyticsLabel, onOpenChange)
            }
            {...props}
        />
    )
}

function DrawerTrigger({
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
    return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
    return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
    return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
    className,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
    return (
        <DrawerPrimitive.Overlay
            data-slot="drawer-overlay"
            data-openpanel-replay-block
            className={cn(
                // z-[200] : au-dessus de `.sticky-top-safe` (z-100) et de tout ce qui est
                // "page-level" (headers sticky, scrim safe-area, popovers). Sinon un header
                // sticky (ex. RestSinceLastSetBar sur ExerciseDetailPage) passe DEVANT le
                // drawer une fois qu'il est ouvert et le clavier remonte le drawer.
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[200] bg-black/50",
                className
            )}
            {...props}
        />
    )
}

function DrawerContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
    return (
        <DrawerPortal data-slot="drawer-portal">
            <DrawerOverlay />
            <DrawerPrimitive.Content
                data-slot="drawer-content"
                style={{
                    // `--keyboard-inset` est alimenté UNIQUEMENT sur iOS
                    // (voir `client/src/hooks/use-keyboard-inset.ts`).
                    // Sur Android (MainActivity rétrécit déjà la WebView) et sur web,
                    // la variable reste à 0px → `bottom: 0` + `max-h: 80vh` sans effet
                    // parasite. Ne pas retirer ce fallback.
                    ["--drawer-keyboard-inset" as string]: "var(--keyboard-inset, 0px)",
                }}
                className={cn(
                    // z-[200] cohérent avec DrawerOverlay ci-dessus (voir commentaire).
                    "group/drawer-content bg-background fixed z-[200] flex h-auto flex-col",
                    "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
                    // `pb-[var(--safe-bottom)]` : sur Android edge-to-edge, le drawer
                    // est collé à bottom:0 ; sans ce padding le CTA final passe sous
                    // la barre de navigation système (3 boutons). Inoffensif si inset=0.
                    "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-[var(--drawer-keyboard-inset)] data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[calc(80vh-var(--drawer-keyboard-inset))] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t data-[vaul-drawer-direction=bottom]:pb-[var(--safe-bottom)]",
                    "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
                    "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
                    "transition-[bottom,max-height] duration-200 ease-out",
                    className
                )}
                {...props}
            >
                <div className="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
                {children}
            </DrawerPrimitive.Content>
        </DrawerPortal>
    )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="drawer-header"
            className={cn(
                "flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left",
                className
            )}
            {...props}
        />
    )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="drawer-footer"
            className={cn("mt-auto flex flex-col gap-2 p-4", className)}
            {...props}
        />
    )
}

function DrawerTitle({
    className,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
    return (
        <DrawerPrimitive.Title
            data-slot="drawer-title"
            className={cn("text-foreground font-one-more uppercase italic text-sm", className)}
            {...props}
        />
    )
}

function DrawerDescription({
    className,
    ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
    return (
        <DrawerPrimitive.Description
            data-slot="drawer-description"
            className={cn("text-muted-foreground text-sm", className)}
            {...props}
        />
    )
}

export {
    Drawer, DrawerClose,
    DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerPortal, DrawerTitle, DrawerTrigger
}

