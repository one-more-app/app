import { Trackable } from "@/components/analytics/Trackable";
import {
  OnboardingReveal,
  onboardingStepCardClassName,
  OnboardingStepLayout,
} from "@/components/onboarding/onboarding-motion";
import { ReminderScheduleFields } from "@/components/notifications/ReminderScheduleFields";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import {
  NOTIFICATION_PREFERENCES_SWR_KEY,
  useNotificationPreferences,
} from "@/hooks/use-notification-preferences";
import {
  AnalyticsEvents,
  OnboardingSteps,
  track,
  trackOnboardingStepCompleted,
  useOnboardingStepViewed,
} from "@/lib/analytics";
import { hapticImpact } from "@/lib/haptics";
import {
  mergeNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/notifications-api";
import {
  registerPushIfPermitted,
  requestPushPermission,
} from "@/lib/push-notifications";
import {
  DEFAULT_REMINDER_SLOTS,
  reminderSlotsFromPrefs,
  type ReminderSlot,
} from "@/lib/reminder-schedule";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { CalendarDays, ChevronRight, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

type OnboardingFirstSessionReminderProps = {
  onBack: () => void;
  onSkip: () => void;
  /** Rappel jours enregistré. */
  onSaved: () => void;
  /** Bascule vers la recherche de salle existante. */
  onPickGym: () => void;
};

/** Post-inscription, « Tu t'entraînes quand ? » : jours + heure ou salle. */
export function OnboardingFirstSessionReminder({
  onBack,
  onSkip,
  onSaved,
  onPickGym,
}: OnboardingFirstSessionReminderProps) {
  useOnboardingStepViewed(OnboardingSteps.FIRST_SESSION_REMINDER);
  const { mutate } = useSWRConfig();
  const { data: prefs } = useNotificationPreferences();
  const [draft, setDraft] = useState<ReminderSlot[] | null>(null);
  const [busy, setBusy] = useState(false);

  const savedSlots = reminderSlotsFromPrefs(prefs ?? {});
  const slots =
    draft ?? (savedSlots.length > 0 ? savedSlots : DEFAULT_REMINDER_SLOTS);

  const handleActivate = async () => {
    if (busy || slots.length === 0) return;
    setBusy(true);
    try {
      if (Capacitor.isNativePlatform()) {
        const granted = await requestPushPermission();
        if (granted) await registerPushIfPermitted();
        track(
          granted
            ? AnalyticsEvents.PUSH_NOTIFICATION_ENABLED
            : AnalyticsEvents.PUSH_NOTIFICATION_DISABLED,
          { source: "onboarding_first_session" },
        );
      }
      const updated = await updateNotificationPreferences({
        streakReminders: true,
        reminderSlots: slots,
      });
      await mutate(
        NOTIFICATION_PREFERENCES_SWR_KEY,
        (current: Parameters<typeof mergeNotificationPreferences>[0]) =>
          mergeNotificationPreferences(current, updated),
        { revalidate: false },
      );
      void hapticImpact();
      trackOnboardingStepCompleted({
        step: OnboardingSteps.FIRST_SESSION_REMINDER,
        reminder_mode: "days",
        reminder_days: slots.length,
      });
      onSaved();
    } catch {
      toast.error(UI.firstSessionReminderSaveError);
    } finally {
      setBusy(false);
    }
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
          contentClassName="gap-4"
          onBack={onBack}
          onSkip={onSkip}
          skipLabel={UI.onboardingSkip}
          skipAnalyticsLabel="first_session_reminder_skip"
          backAnalyticsLabel="first_session_reminder_back"
        >
          <p className="-mt-2 text-muted-foreground">
            {UI.firstSessionReminderSubtitle}
          </p>

          <section
            aria-label={UI.firstSessionReminderDaysTitle}
            className="space-y-4 rounded-2xl border-2 border-foreground bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-accent text-accent-foreground">
                <CalendarDays className="size-[18px]" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-one-more text-xs font-bold uppercase italic">
                  {UI.firstSessionReminderDaysTitle}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  {UI.firstSessionReminderDaysHint}
                </p>
              </div>
              <span
                aria-hidden
                className="flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 border-foreground"
              >
                <span className="size-2 rounded-full bg-foreground" />
              </span>
            </div>
            <ReminderScheduleFields
              slots={slots}
              onChange={setDraft}
              disabled={busy}
            />
          </section>

          <button
            type="button"
            disabled={busy}
            data-analytics-label="first_session_reminder_gym"
            onClick={() => {
              void hapticImpact();
              onPickGym();
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border-2 border-transparent bg-card p-4 text-left transition-colors",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-secondary">
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
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </button>

          <OnboardingReveal delayMs={120} className="mt-auto pt-2">
            <Button
              variant="accent"
              className="w-full"
              data-analytics-label="first_session_reminder_activate"
              disabled={busy || slots.length === 0}
              onClick={() => void handleActivate()}
            >
              {UI.firstSessionReminderCta}
            </Button>
          </OnboardingReveal>
        </StepCard>
      </OnboardingStepLayout>
    </Trackable>
  );
}
