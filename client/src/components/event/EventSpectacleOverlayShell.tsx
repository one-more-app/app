import {
    EVENT_CELEBRATION_STAGGER_MS,
    eventCelebrationEntrance,
} from "@/components/event/event-motion";
import { OnboardingReveal } from "@/components/onboarding/onboarding-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type EventSpectacleOverlayShellProps = {
    ariaLabel: string;
    badgeLabel: ReactNode;
    displayName: string;
    exerciseName: string;
    genderLabel: string;
    gifUrl?: string | null;
    variant?: "live" | "recap" | "celebration";
    children: ReactNode;
};

export function EventSpectacleOverlayShell({
    ariaLabel,
    badgeLabel,
    displayName,
    exerciseName,
    genderLabel: gender,
    gifUrl,
    variant = "live",
    children,
}: EventSpectacleOverlayShellProps) {
    const stagger = EVENT_CELEBRATION_STAGGER_MS;
    const isCelebration = variant === "celebration";

    return (
        <div
            className={eventCelebrationEntrance(
                cn(
                    "fixed inset-0 z-50 flex flex-col items-center overflow-hidden bg-background/95 px-6 py-10 lg:px-12 lg:py-14",
                    variant === "live" ? "justify-start pt-14 lg:pt-20" : "justify-center",
                ),
            )}
            role="img"
            aria-label={ariaLabel}
        >
            <div
                className={cn(
                    "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent)_0%,transparent_62%)]",
                    isCelebration ? "opacity-[0.14]" : "opacity-[0.07]",
                )}
                aria-hidden
            />

            <header className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-5 text-center lg:gap-12">


                <OnboardingReveal delayMs={stagger * 2}>
                    <div className="flex flex-col items-center gap-3 lg:flex-row lg:gap-5">
                        {gifUrl ? (
                            <img
                                src={gifUrl}
                                alt=""
                                className="size-16 rounded-xl object-contain p-1.5 brightness-0 invert  lg:size-20"
                            />
                        ) : null}

                        <div className="flex flex-col items-center gap-1 lg:items-start lg:text-left">
                            <p className="font-one-more text-2xl uppercase italic leading-tight text-foreground lg:text-4xl">
                                {displayName}
                            </p>
                            <p className="font-one-more text-sm uppercase italic tracking-wide text-muted-foreground lg:text-base">
                                {exerciseName}
                                <span className="mx-2 text-border" aria-hidden>
                                    ·
                                </span>
                                {gender}
                            </p>
                        </div>
                    </div>
                </OnboardingReveal>

                <OnboardingReveal delayMs={stagger * 3}>
                    <div
                        className={cn(
                            "font-one-more text-sm uppercase italic tracking-[0.3em] lg:text-base",
                            isCelebration ? "text-accent" : "text-accent/80",
                        )}
                    >
                        {badgeLabel}
                    </div>
                </OnboardingReveal>
            </header>

            <div
                className={cn(
                    "relative z-10 flex w-full flex-1 items-center justify-center",
                    variant === "live" ? "mt-10 lg:mt-16" : "py-6 lg:py-10",
                )}
            >
                <OnboardingReveal delayMs={stagger * 4} className="w-full">
                    {children}
                </OnboardingReveal>
            </div>
        </div>
    );
}
