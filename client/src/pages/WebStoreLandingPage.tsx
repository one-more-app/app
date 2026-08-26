import logoTextLight from "@/assets/logo-text.png";
import {
    AnimatedWords,
    onboardingEntrance,
} from "@/components/onboarding/onboarding-motion";
import { OnboardingShell } from "@/components/OnboardingShell";
import { Button } from "@/components/ui/button";
import { UI } from "@/lib/translations";
import { resolveWebStoreLandingOneLink } from "@/lib/web-store-landing";
import { useLocation } from "react-router-dom";

function AppleLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            aria-hidden
            focusable="false"
        >
            <path
                fill="currentColor"
                d="M16.365 12.93c0-1.704 1.393-2.528 1.455-2.566-.793-1.16-2.027-1.32-2.465-1.338-1.05-.106-2.047.618-2.58.618-.533 0-1.356-.603-2.23-.587-1.147.017-2.205.667-2.795 1.694-1.192 2.07-.305 5.14.856 6.822.568.824 1.245 1.75 2.134 1.717.858-.035 1.182-.555 2.22-.555 1.037 0 1.328.555 2.236.538.924-.015 1.51-.84 2.076-1.668.655-.958.924-1.887.94-1.935-.02-.01-1.803-.692-1.82-2.745zm-1.415-4.71c.472-.572.79-1.366.703-2.158-.68.027-1.503.453-1.99 1.025-.437.508-.82 1.32-.717 2.098.758.059 1.532-.385 2.004-.965z"
            />
        </svg>
    );
}

function AndroidLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            aria-hidden
            focusable="false"
        >
            <path
                fill="currentColor"
                d="M17.6 9.48c.55 0 1 .45 1 1v6.04c0 .55-.45 1-1 1s-1-.45-1-1V10.48c0-.55.45-1 1-1zm-11.2 0c.55 0 1 .45 1 1v6.04c0 .55-.45 1-1 1s-1-.45-1-1V10.48c0-.55.45-1 1-1zM7.13 9.5h9.74c.2 0 .37.16.37.37v8.26c0 .9-.73 1.63-1.63 1.63h-.5v2.12c0 .55-.45 1-1 1s-1-.45-1-1v-2.12h-2.22v2.12c0 .55-.45 1-1 1s-1-.45-1-1v-2.12h-.5c-.9 0-1.63-.73-1.63-1.63V9.87c0-.21.16-.37.37-.37zm8.74-3.16.86-1.49c.1-.17.04-.38-.13-.48-.17-.1-.38-.04-.48.13l-.87 1.51A6.4 6.4 0 0 0 12 5.7c-1.16 0-2.24.31-3.17.86l-.87-1.51c-.1-.17-.31-.23-.48-.13-.17.1-.23.31-.13.48l.86 1.49C6.7 7.3 5.7 8.76 5.7 10.45h12.6c0-1.69-1-3.15-2.43-4.11zM10.1 8.35a.6.6 0 1 1 0-1.2.6.6 0 0 1 0 1.2zm3.8 0a.6.6 0 1 1 0-1.2.6.6 0 0 1 0 1.2z"
            />
        </svg>
    );
}

export function WebStoreLandingPage() {
    const { pathname } = useLocation();
    const oneLink = resolveWebStoreLandingOneLink(pathname);

    return (
        <OnboardingShell variant="cinematic">
            <header className="flex shrink-0 justify-center px-4 pt-4">
                <img
                    src={logoTextLight}
                    alt={UI.webStoreLandingLogoAlt}
                    className={onboardingEntrance(
                        "h-14 w-auto select-none object-contain sm:h-16 animate-in fade-in-0 slide-in-from-left-4 duration-400",
                    )}
                    loading="eager"
                    decoding="async"
                />
            </header>

            <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-8">
                <div className="space-y-4 text-center">
                    <h1 className="font-one-more text-4xl font-semibold uppercase italic leading-[1.05] tracking-tight sm:text-5xl">
                        <AnimatedWords
                            text={UI.webStoreLandingTitle}
                            baseDelayMs={140}
                            staggerMs={50}
                        />
                    </h1>
                    <p
                        className={onboardingEntrance(
                            "text-base leading-relaxed text-muted-foreground animate-in fade-in-0 slide-in-from-left-3 duration-350 [animation-delay:360ms]",
                        )}
                    >
                        {UI.webStoreLandingBody}
                    </p>
                </div>

                <div
                    className={onboardingEntrance(
                        "mt-8 flex w-full flex-col items-center gap-4 animate-in fade-in-0 slide-in-from-left-4 duration-400 [animation-delay:480ms]",
                    )}
                >
                    <Button variant="accent" className="w-full" size="lg" asChild>
                        <a href={oneLink}>{UI.webStoreLandingCta}</a>
                    </Button>
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-4">
                            <a
                                href={oneLink}
                                aria-label={UI.webStoreLandingIosAlt}
                                className="text-foreground/90 transition-opacity hover:opacity-80"
                            >
                                <AppleLogo className="size-8" />
                            </a>
                            <a
                                href={oneLink}
                                aria-label={UI.webStoreLandingAndroidAlt}
                                className="text-foreground/90 transition-opacity hover:opacity-80"
                            >
                                <AndroidLogo className="size-6" />
                            </a>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {UI.webStoreLandingStores}
                        </p>
                    </div>
                </div>
            </main>
        </OnboardingShell>
    );
}
