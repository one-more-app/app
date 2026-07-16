import { getLocalDateKey } from "@/lib/local-date";
import { sessionDurationLabels } from "@/lib/session-duration-labels";
import type { PerformanceEntry } from "@/types";
import {
  computeSessionTiming,
  formatSessionTimingLabel,
  type SessionTiming,
} from "@one-more/shared/session-timing";
import { useEffect, useMemo, useState } from "react";

type UseSessionTimingOpts = {
  dayKey: string;
  isPresenceTraining?: boolean;
};

export function useSessionTiming(
  entries: PerformanceEntry[],
  { dayKey, isPresenceTraining }: UseSessionTimingOpts,
) {
  const [now, setNow] = useState(() => Date.now());

  const timing = useMemo<SessionTiming | null>(
    () =>
      computeSessionTiming(entries, {
        now,
        dayKey,
        todayKey: getLocalDateKey(),
        isPresenceTraining,
      }),
    [entries, now, dayKey, isPresenceTraining],
  );

  useEffect(() => {
    if (!timing?.isInProgress) return;
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [timing?.isInProgress]);

  const label = useMemo(() => {
    if (!timing) return null;
    return formatSessionTimingLabel(timing, sessionDurationLabels());
  }, [timing]);

  return { timing, label };
}
