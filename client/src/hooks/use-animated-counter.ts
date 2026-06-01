import { hapticImpact } from "@/lib/haptics";
import { useEffect, useState } from "react";

export function useAnimatedCounter(
  from: number,
  to: number,
  enabled: boolean,
): number {
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!enabled) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduced || from >= to) {
      setValue(to);
      if (to > from) void hapticImpact();
      return;
    }

    setValue(from);
    const steps = to - from;
    const duration = Math.min(1400, 450 + steps * 130);
    const stepMs = duration / steps;
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 1; i <= steps; i++) {
      timers.push(
        setTimeout(() => {
          const next = from + i;
          setValue(next);
          void hapticImpact();
        }, stepMs * i),
      );
    }

    return () => {
      for (const id of timers) clearTimeout(id);
    };
  }, [enabled, from, to]);

  return value;
}
