import { Trackable } from "@/components/analytics/Trackable";
import {
  OnboardingReveal,
  onboardingStepCardClassName,
  OnboardingStepLayout,
} from "@/components/onboarding/onboarding-motion";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { OnboardingSteps, useOnboardingStepViewed } from "@/lib/analytics";
import {
  formatNextReminderDay,
  formatReminderClock,
  formatReminderScheduleShort,
  reminderSlotsFromPrefs,
  resolveNextReminder,
} from "@/lib/reminder-schedule";
import { UI } from "@/lib/translations";
import { Bell, Check, Play } from "lucide-react";
import { useMemo } from "react";

const POINTS = [
  UI.firstSessionNotedPoint1,
  UI.firstSessionNotedPoint2,
  UI.firstSessionNotedPoint3,
];

type OnboardingFirstSessionConfirmProps = {
  onBack: () => void;
  onStartNow: () => void;
  onHome: () => void;
};

/** Post-inscription, « C'est noté » : prochain rappel et suite. */
export function OnboardingFirstSessionConfirm({
  onBack,
  onStartNow,
  onHome,
}: OnboardingFirstSessionConfirmProps) {
  useOnboardingStepViewed(OnboardingSteps.FIRST_SESSION_CONFIRM);
  const { data: prefs } = useNotificationPreferences();

  const { title, body, schedule } = useMemo(() => {
    const slots = reminderSlotsFromPrefs(prefs ?? {});
    const next = resolveNextReminder(slots);
    if (!next) {
      return {
        title: UI.firstSessionNotedTitle.replace(
          "{day}",
          UI.reminderNextTomorrow,
        ),
        body: UI.firstSessionNotedBodyNoNext,
        schedule: formatReminderScheduleShort(slots),
      };
    }
    const day = formatNextReminderDay(next);
    return {
      title:
        next.daysAhead === 0
          ? UI.firstSessionNotedTitleToday
          : UI.firstSessionNotedTitle.replace("{day}", day),
      body: UI.firstSessionNotedBody
        .replace("{day}", day)
        .replace("{time}", formatReminderClock(next.hour, next.minute)),
      schedule: formatReminderScheduleShort(slots),
    };
  }, [prefs]);

  return (
    <Trackable
      section="onboarding"
      feature={OnboardingSteps.FIRST_SESSION_CONFIRM}
    >
      <OnboardingStepLayout>
        <StepCard
          className={onboardingStepCardClassName}
          title={title}
          headerClassName="space-y-3"
          contentClassName="gap-4"
          onBack={onBack}
          backAnalyticsLabel="first_session_confirm_back"
        >
          <p className="-mt-2 leading-relaxed text-muted-foreground">{body}</p>

          <Card className="gap-4 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-accent text-accent-foreground">
                <Bell className="size-[18px]" aria-hidden />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="font-one-more text-xs font-bold uppercase italic">
                  {UI.firstSessionNotedCardTitle}
                </p>
                {schedule ? (
                  <p className="text-sm text-muted-foreground">{schedule}.</p>
                ) : null}
              </div>
            </div>
            <ul className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
              {POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <Check className="size-4 shrink-0" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="gap-2 p-4">
            <p className="font-medium">{UI.firstSessionNotedAtGymTitle}</p>
            <p className="text-muted-foreground">
              {UI.firstSessionNotedAtGymBody}
            </p>
          </Card>

          <OnboardingReveal delayMs={120} className="mt-auto space-y-2 pt-2">
            <Button
              variant="accent"
              className="w-full"
              data-analytics-label="first_session_confirm_start_now"
              onClick={onStartNow}
            >
              <Play className="size-3.5 fill-current" aria-hidden />
              {UI.firstSessionNotedStartNow}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              data-analytics-label="first_session_confirm_home"
              onClick={onHome}
            >
              {UI.firstSessionNotedHome}
            </Button>
          </OnboardingReveal>
        </StepCard>
      </OnboardingStepLayout>
    </Trackable>
  );
}
