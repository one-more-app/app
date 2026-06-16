import { useAnalyticsContext } from "@/components/analytics/analytics-context";
import {
  track as baseTrack,
  trackAttrs as baseTrackAttrs,
  type AnalyticsContext,
  type AnalyticsEventName,
  type AnalyticsProperties,
} from "@/lib/analytics";
import { useCallback, useMemo } from "react";

export type UseAnalyticsReturn = {
  track: (event: AnalyticsEventName | string, props?: AnalyticsProperties) => void;
  trackAttrs: (
    event: AnalyticsEventName | string,
    props?: AnalyticsProperties,
  ) => Record<string, string>;
  context: AnalyticsContext;
};

/**
 * Hook principal pour le tracking impératif dans les composants.
 * Fusionne automatiquement le contexte `Trackable` / `PageTracker`.
 */
export function useAnalytics(): UseAnalyticsReturn {
  const context = useAnalyticsContext();

  const track = useCallback(
    (event: AnalyticsEventName | string, props: AnalyticsProperties = {}) => {
      baseTrack(event, props, context);
    },
    [context],
  );

  const trackAttrs = useCallback(
    (event: AnalyticsEventName | string, props: AnalyticsProperties = {}) => {
      return baseTrackAttrs(event, props, context);
    },
    [context],
  );

  return useMemo(
    () => ({ track, trackAttrs, context }),
    [track, trackAttrs, context],
  );
}
