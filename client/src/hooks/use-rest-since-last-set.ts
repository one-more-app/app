import {
  formatRestElapsed,
  getRestElapsedMs,
  getRestProgress01,
  isRestSinceLastSetVisible,
  REST_SINCE_LAST_SET_MAX_MS,
} from "@/lib/format-rest-elapsed";
import { useEffect, useState } from "react";

export function useRestSinceLastSet(createdAt: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!createdAt || !isRestSinceLastSetVisible(createdAt)) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;

    const tickNow = () => {
      const currentNow = Date.now();
      setNow(currentNow);
      if (!isRestSinceLastSetVisible(createdAt, currentNow) && intervalId != null) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const startInterval = () => {
      if (intervalId != null) return;
      intervalId = setInterval(tickNow, 1000);
    };

    const stopInterval = () => {
      if (intervalId == null) return;
      clearInterval(intervalId);
      intervalId = undefined;
    };

    const onVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        isRestSinceLastSetVisible(createdAt)
      ) {
        setNow(Date.now());
        startInterval();
      } else {
        stopInterval();
      }
    };

    if (document.visibilityState === "visible") {
      startInterval();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [createdAt]);

  const elapsedMs = getRestElapsedMs(createdAt, now) ?? 0;
  const visible = isRestSinceLastSetVisible(createdAt, now);

  return {
    visible,
    elapsedMs: visible ? elapsedMs : 0,
    formatted: formatRestElapsed(elapsedMs),
    progress01: visible ? getRestProgress01(elapsedMs) : 0,
  };
}

export { REST_SINCE_LAST_SET_MAX_MS };
