import type { ReactNode } from "react";

export function OnboardingVideoShell({ children }: { children: ReactNode }) {
    return (
        <div className="relative flex h-full min-h-full flex-col overflow-hidden bg-black">
            <video
                className="absolute inset-0 h-full w-full object-cover pointer-events-none bg-black"
                src="/onboarding-bg.mp4"
                muted
                autoPlay
                loop
                playsInline
                preload="metadata"
            />
            <div className="absolute inset-0 bg-black/50 pointer-events-none" />
            <div className="pointer-events-none absolute -top-20 -left-20 size-64 rounded-full bg-accent/20 blur-3xl animate-pulse" />
            <div className="pointer-events-none absolute bottom-8 -right-20 size-72 rounded-full bg-primary/20 blur-3xl animate-pulse [animation-delay:700ms]" />
            {children}
        </div>
    );
}
