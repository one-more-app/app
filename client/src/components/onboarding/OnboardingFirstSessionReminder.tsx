import { Trackable } from "@/components/analytics/Trackable";
import {
  OnboardingReveal,
  onboardingStepCardClassName,
  OnboardingStepLayout,
} from "@/components/onboarding/onboarding-motion";
import { StepCard } from "@/components/StepCard";
import {
  OnboardingSteps,
  trackOnboardingStepCompleted,
  trackOnboardingStepSkipped,
  useOnboardingStepViewed,
} from "@/lib/analytics";
import { hapticImpact } from "@/lib/haptics";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronRight, MapPin } from "lucide-react";

type OnboardingFirstSessionReminderProps = {
  onBack: () => void;
  onSkip: () => void;
  /** Branche heure fixe → C1. */
  onPickDays: () => void;
  /** Branche salle → B2. */
  onPickGym: () => void;
};

/** B1 · « On te rappelle comment ? » : salle ou heure fixe (une carte = une navigation). */
export function OnboardingFirstSessionReminder({
  onBack,
  onSkip,
  onPickDays,
  onPickGym,
}: OnboardingFirstSessionReminderProps) {
  useOnboardingStepViewed(OnboardingSteps.FIRST_SESSION_REMINDER);

  const handleSkip = () => {
    trackOnboardingStepSkipped({
      step: OnboardingSteps.FIRST_SESSION_REMINDER,
      reason: "skipped",
    });
    onSkip();
  };

  const handleGym = () => {
    void hapticImpact();
    trackOnboardingStepCompleted({
      step: OnboardingSteps.FIRST_SESSION_REMINDER,
      reminder_mode: "gym",
    });
    onPickGym();
  };

  const handleDays = () => {
    void hapticImpact();
    trackOnboardingStepCompleted({
      step: OnboardingSteps.FIRST_SESSION_REMINDER,
      reminder_mode: "days",
    });
    onPickDays();
  };

  return (
    <Trackable
      section="onboarding"
      feature={OnboardingSteps.FIRST_SESSION_REMINDER}
    >
      <OnboardingStepLayout>
        <StepCard
          className={onboardingStepCardClassName}
          title={UI.firstSessionReminderTitle}
          headerClassName="space-y-3"
          contentClassName="gap-3"
          onBack={onBack}
          onSkip={handleSkip}
          skipLabel={UI.onboardingSkip}
          skipAnalyticsLabel="first_session_reminder_skip"
          backAnalyticsLabel="first_session_reminder_back"
        >
          <p className="-mt-2 text-muted-foreground">
            {UI.firstSessionReminderSubtitle}
          </p>

          <OnboardingReveal delayMs={80}>
            <button
              type="button"
              data-analytics-label="first_session_reminder_gym"
              onClick={handleGym}
              className={cn(
                "flex w-full flex-col gap-3 rounded-xl bg-card p-4 text-left",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <span className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-accent text-accent-foreground">
                  <MapPin className="size-[18px]" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block font-one-more text-xs font-bold uppercase italic">
                    {UI.firstSessionReminderGymTitle}
                  </span>
                  <span className="block text-[13px] text-muted-foreground">
                    {UI.firstSessionReminderGymHint}
                  </span>
                </span>
                <ChevronRight
                  className="mt-1 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </span>
              <span className="w-fit rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                {UI.firstSessionReminderGymBadge}
              </span>
            </button>
          </OnboardingReveal>

          <OnboardingReveal delayMs={140}>
            <button
              type="button"
              data-analytics-label="first_session_reminder_days"
              onClick={handleDays}
              className={cn(
                "flex w-full flex-col gap-3 rounded-xl bg-card p-4 text-left",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <span className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-secondary">
                  <CalendarDays className="size-[18px]" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block font-one-more text-xs font-bold uppercase italic">
                    {UI.firstSessionReminderDaysTitle}
                  </span>
                  <span className="block text-[13px] text-muted-foreground">
                    {UI.firstSessionReminderDaysHint}
                  </span>
                </span>
                <ChevronRight
                  className="mt-1 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </span>
              <span className="w-fit rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                {UI.firstSessionReminderDaysBadge}
              </span>
            </button>
          </OnboardingReveal>
        </StepCard>
      </OnboardingStepLayout>
    </Trackable>
  );
}
