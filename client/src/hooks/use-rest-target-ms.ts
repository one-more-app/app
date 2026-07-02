import { getRestTargetMs, setRestTargetMs } from "@/lib/storage";
import { useCallback, useEffect, useState } from "react";

export function useRestTargetMs(): number {
  const [targetMs, setTargetMs] = useState(() => getRestTargetMs());

  useEffect(() => {
    const onChanged = () => setTargetMs(getRestTargetMs());
    window.addEventListener("one-more:rest-target-changed", onChanged);
    return () =>
      window.removeEventListener("one-more:rest-target-changed", onChanged);
  }, []);

  const updateTargetMs = useCallback((ms: number) => {
    setRestTargetMs(ms);
    setTargetMs(getRestTargetMs());
  }, []);

  return { targetMs, setTargetMs: updateTargetMs };
}
