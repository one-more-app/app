import type { ReactNode } from "react";

export function OnboardingShell({ children }: { children: ReactNode }) {
    return (
        <div className="dark fixed inset-0 overflow-hidden bg-black text-foreground">
            <video
                className="pointer-events-none absolute inset-0 h-full w-full bg-black object-cover"
                src="/onboarding-bg.mp4"
                muted
                autoPlay
                loop
                playsInline
                preload="metadata"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/50" />
            <div className="pointer-events-none absolute -top-20 -left-20 size-64 animate-pulse rounded-full bg-accent/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-8 -right-20 size-72 animate-pulse rounded-full bg-primary/20 blur-3xl [animation-delay:700ms]" />
            <div className="relative z-10 flex min-h-dvh flex-col safe-padding">
                {children}
            </div>
        </div>
    );
}
