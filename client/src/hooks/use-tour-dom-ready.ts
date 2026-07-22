import { useLayoutEffect, useState } from "react";

function areTourTargetsReady(selectors: readonly string[]): boolean {
  return selectors.every((selector) => document.querySelector(selector));
}

/**
 * Attend que toutes les cibles Joyride soient dans le DOM.
 * Gate React (enabled) + MutationObserver jusqu'à présence réelle des targets.
 */
export function useTourDomReady(
  enabled: boolean,
  selectors: readonly string[],
): boolean {
  const selectorsKey = selectors.join("\0");
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    if (!enabled || selectors.length === 0) {
      setReady(false);
      return;
    }

    let cancelled = false;

    const markReady = () => {
      if (cancelled || !areTourTargetsReady(selectors)) return false;
      setReady(true);
      return true;
    };

    if (markReady()) return;

    setReady(false);

    const observer = new MutationObserver(() => {
      if (markReady()) observer.disconnect();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-tour"],
    });

    // Recheck après observe (évite la course check → observe).
    if (markReady()) {
      observer.disconnect();
      return;
    }

    const frame = requestAnimationFrame(() => {
      if (markReady()) observer.disconnect();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      setReady(false);
    };
  }, [enabled, selectorsKey]);

  return ready;
}
