import { Trackable } from "@/components/analytics/Trackable";
import { onboardingEntrance } from "@/components/onboarding/onboarding-motion";
import { Button } from "@/components/ui/button";
import { OnboardingSteps, useOnboardingStepViewed } from "@/lib/analytics";
import { UI } from "@/lib/translations";
import { Dumbbell, Play, Plus, Trophy, type LucideIcon } from "lucide-react";

const FIRST_SESSION_HERO_SRC = "/images/first-session-hero.jpg";

const POINTS: Array<{ id: string; Icon: LucideIcon; label: string }> = [
  { id: "pick", Icon: Dumbbell, label: UI.firstSessionPoint1 },
  { id: "log", Icon: Plus, label: UI.firstSessionPoint2 },
  { id: "beat", Icon: Trophy, label: UI.firstSessionPoint3 },
];

type OnboardingFirstSessionStartProps = {
  onStart: () => void;
  onLater: () => void;
};

/** Post-inscription, écran « Commencer » : photo plein écran + 3 puces. */
export function OnboardingFirstSessionStart({
  onStart,
  onLater,
}: OnboardingFirstSessionStartProps) {
  useOnboardingStepViewed(OnboardingSteps.FIRST_SESSION);

  return (
    <Trackable
      section="onboarding"
      feature={OnboardingSteps.FIRST_SESSION}
      className="dark relative flex min-h-0 flex-1 flex-col overflow-hidden bg-black text-white"
    >
      <img
        src={FIRST_SESSION_HERO_SRC}
        alt={UI.firstSessionHeroAlt}
        className="pointer-events-none absolute inset-x-0 top-0 h-[55%] w-full select-none object-cover object-[50%_40%]"
        draggable={false}
        loading="eager"
        decoding="async"
      />
      <div
        className={onboardingEntrance(
          "relative mt-auto flex flex-col gap-5 bg-[#0a0a0a] px-5 pb-6 pt-[76px] [clip-path:polygon(0_9%,100%_0,100%_100%,0_100%)] animate-in fade-in-0 slide-in-from-bottom-4 duration-400",
        )}
      >
        <h1
          aria-label={UI.firstSessionTitleA11y}
          className="font-one-more text-[2.4rem] font-semibold uppercase italic leading-[0.92]"
        >
          <span className="block">{UI.firstSessionTitleLine1}</span>
          <span className="accent-text block">{UI.firstSessionTitleLine2}</span>
        </h1>
        <p className="text-[15px] leading-normal text-white/75">
          {UI.firstSessionDescription}
        </p>
        <ul className="flex flex-col gap-3">
          {POINTS.map(({ id, Icon, label }) => (
            <li
              key={id}
              className="flex items-center gap-3 text-[15px] font-semibold"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-white/15 bg-white/10 text-accent">
                <Icon className="size-[18px]" aria-hidden />
              </span>
              {label}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-1">
          <Button
            variant="accent"
            className="h-11 w-full"
            data-analytics-label="first_session_start"
            onClick={onStart}
          >
            <Play className="size-3.5 fill-current" aria-hidden />
            {UI.firstSessionStart}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-full text-sm text-white/70 hover:bg-white/10 hover:text-white"
            data-analytics-label="first_session_later"
            onClick={onLater}
          >
            {UI.firstSessionLater}
          </Button>
        </div>
      </div>
    </Trackable>
  );
}
