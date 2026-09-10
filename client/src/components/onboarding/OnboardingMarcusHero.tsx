import { cn } from "@/lib/utils";

export const ONBOARDING_MARCUS_IMAGE_SRC = "/images/marcus.png";

type OnboardingMarcusHeroProps = {
    className?: string;
};

export function OnboardingMarcusHero({ className }: OnboardingMarcusHeroProps) {
    return (
        <div className={cn("relative shrink-0 overflow-hidden", className)}>
            <img
                src={ONBOARDING_MARCUS_IMAGE_SRC}
                alt=""
                className="h-[calc(300px+var(--safe-top))] w-full select-none object-cover object-[50%_55%]"
                draggable={false}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[200px] bg-gradient-to-t from-background via-background/70 to-transparent"
            />
        </div>
    );
}
