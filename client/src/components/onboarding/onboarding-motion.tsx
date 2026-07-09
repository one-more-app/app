import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

export const onboardingEntrance = (...classes: (string | false | undefined)[]) =>
    cn(
        classes,
        "ease-out [animation-fill-mode:both]",
        "motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-x-0 motion-reduce:translate-y-0",
    );

export const onboardingStepCardClassName = onboardingEntrance(
    "border-border/60 bg-card/95 shadow-lg",
    "animate-in fade-in-0 slide-in-from-left-4 duration-400",
);

export function AnimatedWords({
    text,
    baseDelayMs = 0,
    staggerMs = 55,
}: {
    text: string;
    baseDelayMs?: number;
    staggerMs?: number;
}) {
    const words = text.split(/\s+/).filter(Boolean);
    return (
        <>
            {words.map((word, index) => (
                <span
                    key={`${word}-${index}`}
                    className={onboardingEntrance(
                        "inline-block animate-in fade-in-0 slide-in-from-left-3 duration-350",
                    )}
                    style={{
                        animationDelay: `${baseDelayMs + index * staggerMs}ms`,
                    }}
                >
                    {word}
                    {index < words.length - 1 ? "\u00A0" : ""}
                </span>
            ))}
        </>
    );
}

export function OnboardingReveal({
    children,
    className,
    delayMs = 0,
}: {
    children: ReactNode;
    className?: string;
    delayMs?: number;
}) {
    const style: CSSProperties | undefined =
        delayMs > 0 ? { animationDelay: `${delayMs}ms` } : undefined;

    return (
        <div
            className={onboardingEntrance(
                "animate-in fade-in-0 slide-in-from-left-3 duration-350",
                className,
            )}
            style={style}
        >
            {children}
        </div>
    );
}

export function OnboardingStepLayout({
    children,
    className,
    centered = false,
}: {
    children: ReactNode;
    className?: string;
    centered?: boolean;
}) {
    return (
        <main
            className={cn(
                "relative z-10 mx-auto w-full max-w-2xl px-4 py-8",
                centered &&
                    "flex min-h-[50vh] flex-col items-center justify-center gap-3 py-16",
                className,
            )}
        >
            {children}
        </main>
    );
}
