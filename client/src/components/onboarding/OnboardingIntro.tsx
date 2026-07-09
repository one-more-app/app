import logoTextLight from "@/assets/logo-text.png";
import {
    AnimatedWords,
    onboardingEntrance,
} from "@/components/onboarding/onboarding-motion";
import { Button } from "@/components/ui/button";
import { UI } from "@/lib/translations";

type OnboardingIntroProps = {
    onContinue: () => void;
    errorMessage?: string | null;
};

export function OnboardingIntro({ onContinue, errorMessage }: OnboardingIntroProps) {
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <header className="flex shrink-0 justify-center px-4 pt-4">
                <img
                    src={logoTextLight}
                    alt="One More"
                    className={onboardingEntrance(
                        "h-14 w-auto select-none object-contain sm:h-16 animate-in fade-in-0 slide-in-from-left-4 duration-400",
                    )}
                    loading="eager"
                    decoding="async"
                />
            </header>

            <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-8">
                <div className="space-y-4 text-center">
                    <h1 className="font-one-more text-4xl font-semibold uppercase italic leading-[1.05] tracking-tight sm:text-5xl">
                        <AnimatedWords
                            text={UI.onboardingTitle}
                            baseDelayMs={140}
                            staggerMs={50}
                        />
                    </h1>
                    <p
                        className={onboardingEntrance(
                            "text-base leading-relaxed text-muted-foreground animate-in fade-in-0 slide-in-from-left-3 duration-350 [animation-delay:360ms]",
                        )}
                    >
                        {UI.onboardingDescription}
                    </p>
                </div>

                {errorMessage ? (
                    <div
                        className={onboardingEntrance(
                            "mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive animate-in fade-in-0 slide-in-from-left-2 duration-300",
                        )}
                    >
                        {errorMessage}
                    </div>
                ) : null}
            </main>

            <footer className="shrink-0 px-4 pb-4">
                <div
                    className={onboardingEntrance(
                        "animate-in fade-in-0 slide-in-from-left-4 duration-400 [animation-delay:480ms]",
                    )}
                >
                    <Button variant="accent" className="w-full" onClick={onContinue}>
                        {UI.continue}
                    </Button>
                </div>
            </footer>
        </div>
    );
}
