import { isRestTimerEnabled, setRestTimerEnabled } from "@/lib/storage";
import { useCallback, useEffect, useState } from "react";

export function useRestTimerEnabled(): {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
} {
  const [enabled, setEnabledState] = useState(() => isRestTimerEnabled());

  useEffect(() => {
    const onChanged = () => setEnabledState(isRestTimerEnabled());
    window.addEventListener("one-more:rest-timer-enabled-changed", onChanged);
    return () =>
      window.removeEventListener("one-more:rest-timer-enabled-changed", onChanged);
  }, []);

  const updateEnabled = useCallback((nextEnabled: boolean) => {
    setRestTimerEnabled(nextEnabled);
    setEnabledState(isRestTimerEnabled());
  }, []);

  return { enabled, setEnabled: updateEnabled };
}
