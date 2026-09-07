import { cn } from "@/lib/utils";

export const ONBOARDING_MARCUS_IMAGE_SRC = "/images/marcus.png";

type OnboardingMarcusHeroProps = {
    className?: string;
};

export function OnboardingMarcusHero({ className }: OnboardingMarcusHeroProps) {
    return (
        <div className={cn("relative -mx-4 shrink-0 overflow-hidden", className)}>
            <img
                src={ONBOARDING_MARCUS_IMAGE_SRC}
                alt=""
                className="h-50 w-full select-none object-cover object-[50%_15%]"
                draggable={false}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background via-background/70 to-transparent"
            />
        </div>
    );
}
