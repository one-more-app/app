import { useSessionTiming } from "@/hooks/use-session-timing";
import type { PerformanceEntry } from "@/types";
import { cn } from "@/lib/utils";

type SessionTimingLabelProps = {
  entries: PerformanceEntry[];
  dayKey: string;
  isPresenceTraining?: boolean;
  className?: string;
};

export function SessionTimingLabel({
  entries,
  dayKey,
  isPresenceTraining,
  className,
}: SessionTimingLabelProps) {
  const { label, timing } = useSessionTiming(entries, {
    dayKey,
    isPresenceTraining,
  });

  if (!label || !timing) return null;

  return (
    <span
      className={cn(
        "text-xs text-muted-foreground",
        timing.isInProgress && "font-medium text-amber-700 dark:text-amber-300",
        className,
      )}
    >
      {label}
    </span>
  );
}
