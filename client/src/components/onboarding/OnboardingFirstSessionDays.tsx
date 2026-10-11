import { Trackable } from "@/components/analytics/Trackable";
import { TimePicker } from "@/components/TimePicker";
import {
  OnboardingReveal,
  onboardingStepCardClassName,
  OnboardingStepLayout,
} from "@/components/onboarding/onboarding-motion";
import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
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
  applyReminderTimeToAllSlots,
  FIRST_SESSION_DEFAULT_REMINDER_SLOTS,
  formatReminderClock,
  REMINDER_WEEKDAY_OPTIONS,
  reminderSlotsFromPrefs,
  setReminderSlotTime,
  toggleReminderSlot,
  weekdayFullName,
  type IsoWeekday,
  type ReminderSlot,
} from "@/lib/reminder-schedule";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

type OnboardingFirstSessionDaysProps = {
  onBack: () => void;
  onSaved: () => void;
};

/** C1 · Tes jours d'entraînement : un créneau (jour + heure) par jour actif. */
export function OnboardingFirstSessionDays({
  onBack,
  onSaved,
}: OnboardingFirstSessionDaysProps) {
  useOnboardingStepViewed(OnboardingSteps.FIRST_SESSION_DAYS);
  const { mutate } = useSWRConfig();
  const { data: prefs } = useNotificationPreferences();
  const [draft, setDraft] = useState<ReminderSlot[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingDay, setEditingDay] = useState<IsoWeekday | null>(null);
  const [draftHour, setDraftHour] = useState(18);
  const [draftMinute, setDraftMinute] = useState(30);

  const savedSlots = reminderSlotsFromPrefs(prefs ?? {});
  const slots =
    draft ??
    (savedSlots.length > 0 ? savedSlots : FIRST_SESSION_DEFAULT_REMINDER_SLOTS);
  const byDay = useMemo(
    () => new Map(slots.map((slot) => [slot.weekday, slot])),
    [slots],
  );
  const otherActiveCount = editingDay
    ? slots.filter((slot) => slot.weekday !== editingDay).length
    : 0;

  const openTimeDrawer = (weekday: IsoWeekday) => {
    const slot = byDay.get(weekday);
    if (!slot) return;
    void hapticImpact();
    setDraftHour(slot.hour);
    setDraftMinute(slot.minute);
    setEditingDay(weekday);
  };

  const closeTimeDrawer = () => setEditingDay(null);

  const handleToggleDay = (weekday: IsoWeekday, enabled: boolean) => {
    const selected = byDay.has(weekday);
    if (enabled === selected) return;
    setDraft(toggleReminderSlot(slots, weekday));
  };

  const handleValidateTime = () => {
    if (editingDay == null) return;
    setDraft(setReminderSlotTime(slots, editingDay, draftHour, draftMinute));
    void hapticImpact();
    closeTimeDrawer();
  };

  const handleApplyToAll = () => {
    if (editingDay == null) return;
    setDraft(applyReminderTimeToAllSlots(slots, draftHour, draftMinute));
    void hapticImpact();
    closeTimeDrawer();
  };

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
          { source: "onboarding_first_session_days" },
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
        step: OnboardingSteps.FIRST_SESSION_DAYS,
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
      feature={OnboardingSteps.FIRST_SESSION_DAYS}
    >
      <OnboardingStepLayout>
        <StepCard
          className={onboardingStepCardClassName}
          title={UI.firstSessionDaysTitle}
          headerClassName="space-y-3"
          contentClassName="gap-4"
          onBack={onBack}
          backAnalyticsLabel="first_session_days_back"
        >
          <p className="-mt-2 text-muted-foreground">
            {UI.firstSessionDaysSubtitle}
          </p>

          <section className="overflow-hidden rounded-xl bg-card">
            {REMINDER_WEEKDAY_OPTIONS.map((day, index) => {
              const slot = byDay.get(day.iso);
              const active = Boolean(slot);
              return (
                <div
                  key={day.iso}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
                    index > 0 && "border-t border-border",
                  )}
                >
                  <Switch
                    checked={active}
                    disabled={busy}
                    aria-label={day.full}
                    data-analytics-label={`first_session_day_toggle_${day.iso}`}
                    onCheckedChange={(checked) =>
                      handleToggleDay(day.iso, checked)
                    }
                  />
                  <span className="min-w-0 flex-1 text-sm font-medium capitalize">
                    {day.full}
                  </span>
                  {active && slot ? (
                    <button
                      type="button"
                      disabled={busy}
                      data-analytics-label={`first_session_day_time_${day.iso}`}
                      onClick={() => openTimeDrawer(day.iso)}
                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-secondary px-2.5 font-one-more text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {formatReminderClock(slot.hour, slot.minute)}
                      <ChevronDown className="size-3.5 opacity-60" aria-hidden />
                    </button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {UI.firstSessionDaysRest}
                    </span>
                  )}
                </div>
              );
            })}
          </section>

          <OnboardingReveal delayMs={120} className="mt-auto pt-2">
            <Button
              variant="accent"
              className="w-full"
              data-analytics-label="first_session_days_activate"
              disabled={busy || slots.length === 0}
              onClick={() => void handleActivate()}
            >
              {UI.firstSessionReminderCta}
            </Button>
          </OnboardingReveal>
        </StepCard>
      </OnboardingStepLayout>

      <Drawer
        open={editingDay != null}
        onOpenChange={(open) => {
          if (!open) closeTimeDrawer();
        }}
        analyticsLabel="first_session_day_time"
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {UI.firstSessionDaysTimeDrawerTitle.replace(
                "{day}",
                editingDay != null ? weekdayFullName(editingDay) : "",
              )}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2">
            <TimePicker
              hour={draftHour}
              minute={draftMinute}
              onChange={(hour, minute) => {
                setDraftHour(hour);
                setDraftMinute(minute);
              }}
            />
          </div>
          <DrawerFooter className="gap-2">
            <Button
              variant="accent"
              className="w-full"
              data-analytics-label="first_session_day_time_validate"
              onClick={handleValidateTime}
            >
              {UI.firstSessionDaysValidate}
            </Button>
            {otherActiveCount > 0 ? (
              <Button
                variant="secondary"
                className="w-full"
                data-analytics-label="first_session_day_time_apply_all"
                onClick={handleApplyToAll}
              >
                {UI.firstSessionDaysApplyToAll}
              </Button>
            ) : null}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Trackable>
  );
}
