import { TimePicker } from "@/components/TimePicker";
import { Label } from "@/components/ui/label";
import { hapticSelectionChanged } from "@/lib/haptics";
import {
  formatReminderSchedule,
  formatReminderTime,
  REMINDER_WEEKDAY_OPTIONS,
  setReminderSlotTime,
  toggleReminderSlot,
  weekdayFullName,
  type IsoWeekday,
  type ReminderSlot,
} from "@/lib/reminder-schedule";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

export function ReminderDaySelect({
  slots,
  focusedWeekday,
  onDayPress,
  disabled,
}: {
  slots: ReminderSlot[];
  focusedWeekday: IsoWeekday | null;
  onDayPress: (weekday: IsoWeekday) => void;
  disabled?: boolean;
}) {
  const selected = new Map(slots.map((slot) => [slot.weekday, slot]));

  return (
    <div
      className="grid grid-cols-7 gap-1.5"
      role="group"
      aria-label={UI.onboardingNotificationsDaysLabel}
    >
      {REMINDER_WEEKDAY_OPTIONS.map((day) => {
        const slot = selected.get(day.iso);
        const isSelected = Boolean(slot);
        const isFocused = focusedWeekday === day.iso;
        const time = slot
          ? formatReminderTime(slot.hour, slot.minute)
          : "00h00";
        return (
          <button
            key={day.iso}
            type="button"
            disabled={disabled}
            aria-pressed={isSelected}
            aria-current={isFocused ? "true" : undefined}
            aria-label={
              isSelected
                ? `${day.full}, ${time}`
                : day.full
            }
            data-analytics-label={`reminder_day_${day.iso}`}
            onClick={() => {
              void hapticSelectionChanged();
              onDayPress(day.iso);
            }}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center rounded-xl px-0.5 py-1.5 text-center transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isFocused
                ? "bg-foreground text-background"
                : isSelected
                  ? "bg-muted text-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-muted/80",
            )}
          >
            <span className="font-one-more text-[0.7rem] uppercase leading-none tracking-wide sm:text-xs">
              {day.short}
            </span>
            <span
              className={cn(
                "mt-1 font-one-more text-[0.6rem] leading-none tabular-nums",
                !isSelected && "invisible",
              )}
            >
              {time}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ReminderScheduleFields({
  slots,
  onChange,
  disabled,
}: {
  slots: ReminderSlot[];
  onChange: (next: ReminderSlot[]) => void;
  disabled?: boolean;
}) {
  const [focusedWeekday, setFocusedWeekday] = useState<IsoWeekday | null>(
    () => slots[0]?.weekday ?? null,
  );

  useEffect(() => {
    if (focusedWeekday && slots.some((slot) => slot.weekday === focusedWeekday)) {
      return;
    }
    setFocusedWeekday(slots[0]?.weekday ?? null);
  }, [slots, focusedWeekday]);

  const focusedSlot = useMemo(
    () => slots.find((slot) => slot.weekday === focusedWeekday) ?? null,
    [slots, focusedWeekday],
  );
  const summary = formatReminderSchedule(slots);
  const timeLabel = focusedSlot
    ? UI.onboardingNotificationsTimeForDay.replace(
        "{day}",
        weekdayFullName(focusedSlot.weekday),
      )
    : UI.onboardingNotificationsTimeLabel;

  const handleDayPress = (weekday: IsoWeekday) => {
    const selected = slots.some((slot) => slot.weekday === weekday);
    if (!selected) {
      onChange(toggleReminderSlot(slots, weekday, focusedSlot));
      setFocusedWeekday(weekday);
      return;
    }
    if (focusedWeekday !== weekday) {
      setFocusedWeekday(weekday);
      return;
    }
    const next = toggleReminderSlot(slots, weekday);
    onChange(next);
    setFocusedWeekday(next[0]?.weekday ?? null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{UI.onboardingNotificationsDaysLabel}</Label>
        <ReminderDaySelect
          slots={slots}
          focusedWeekday={focusedWeekday}
          onDayPress={handleDayPress}
          disabled={disabled}
        />
        <p className="text-center text-xs text-muted-foreground">
          {UI.onboardingNotificationsDayTimeHint}
        </p>
        {slots.length > 0 ? (
          <button
            type="button"
            disabled={disabled}
            className="mx-auto block text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
            data-analytics-label="reminder_days_clear"
            onClick={() => {
              void hapticSelectionChanged();
              onChange([]);
              setFocusedWeekday(null);
            }}
          >
            {UI.notifPrefReminderClear}
          </button>
        ) : null}
      </div>
      {focusedSlot ? (
        <TimePicker
          hour={focusedSlot.hour}
          minute={focusedSlot.minute}
          label={timeLabel}
          onChange={(hour, minute) => {
            onChange(
              setReminderSlotTime(slots, focusedSlot.weekday, hour, minute),
            );
          }}
          disabled={disabled}
        />
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          {UI.onboardingNotificationsNeedDay}
        </p>
      )}
      {summary ? (
        <p className="text-center text-sm font-medium text-foreground">
          {summary}
        </p>
      ) : null}
    </div>
  );
}
