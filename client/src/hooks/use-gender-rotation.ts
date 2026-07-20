import { useEffect, useState } from "react";
import type { EventGenderSlug } from "@/lib/event-constants";

export function useGenderRotation(intervalMs: number) {
  const [gender, setGender] = useState<EventGenderSlug>("male");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();

    const tick = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const cycle = elapsed % intervalMs;
      setProgress(cycle / intervalMs);
      setGender(Math.floor(elapsed / intervalMs) % 2 === 0 ? "male" : "female");
    }, 100);

    return () => {
      window.clearInterval(tick);
    };
  }, [intervalMs]);

  return { gender, progress };
}
