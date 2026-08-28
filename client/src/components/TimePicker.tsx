import {
  WheelPicker,
  WheelPickerWrapper,
  type WheelPickerOption,
} from "@/components/wheel-picker/wheel-picker";
import {
  clampReminderHour,
  clampReminderMinute,
  formatReminderTime,
} from "@/lib/reminder-schedule";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { useMemo, useRef } from "react";

const HOUR_OPTIONS: WheelPickerOption<number>[] = Array.from(
  { length: 24 },
  (_, hour) => ({
    value: hour,
    label: String(hour).padStart(2, "0"),
  }),
);

const MINUTE_OPTIONS: WheelPickerOption<number>[] = Array.from(
  { length: 60 },
  (_, minute) => ({
    value: minute,
    label: String(minute).padStart(2, "0"),
  }),
);

const WHEEL_CLASS_NAMES = {
  optionItem: "font-one-more tabular-nums",
  highlightWrapper:
    "bg-secondary text-foreground border-y border-border data-rwp-focused:ring-0 data-rwp-focused:ring-transparent",
  highlightItem: "font-one-more italic tabular-nums",
} as const;

type TimePickerProps = {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export function TimePicker({
  hour,
  minute,
  onChange,
  label = UI.onboardingNotificationsTimeLabel,
  disabled = false,
  className,
}: TimePickerProps) {
  const safeHour = clampReminderHour(hour);
  const safeMinute = clampReminderMinute(minute);
  const hourRef = useRef(safeHour);
  const minuteRef = useRef(safeMinute);
  hourRef.current = safeHour;
  minuteRef.current = safeMinute;

  const formatted = useMemo(
    () => formatReminderTime(safeHour, safeMinute),
    [safeHour, safeMinute],
  );

  const handleHourChange = (next: number) => {
    if (next === hourRef.current) return;
    onChange(next, minuteRef.current);
  };

  const handleMinuteChange = (next: number) => {
    if (next === minuteRef.current) return;
    onChange(hourRef.current, next);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      role="group"
      aria-label={label}
    >
      <div className="flex items-baseline justify-between gap-3 px-1">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <span className="font-one-more text-sm italic tabular-nums text-foreground">
          {formatted}
        </span>
      </div>

      <div className="relative mx-auto w-full max-w-[16rem]">
        <WheelPickerWrapper className="h-44 bg-card">
          <WheelPicker<number>
            options={HOUR_OPTIONS}
            value={safeHour}
            onValueChange={handleHourChange}
            infinite
            visibleCount={16}
            optionItemHeight={36}
            classNames={WHEEL_CLASS_NAMES}
          />
          <WheelPicker<number>
            options={MINUTE_OPTIONS}
            value={safeMinute}
            onValueChange={handleMinuteChange}
            infinite
            visibleCount={16}
            optionItemHeight={36}
            classNames={WHEEL_CLASS_NAMES}
          />
        </WheelPickerWrapper>
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 font-one-more text-lg italic text-foreground"
        >
          :
        </span>
      </div>

      <div className="mx-auto grid w-full max-w-[16rem] grid-cols-2 text-center text-xs text-muted-foreground">
        <span>{UI.hourPickerHourColumn}</span>
        <span>{UI.hourPickerMinuteColumn}</span>
      </div>
    </div>
  );
}
