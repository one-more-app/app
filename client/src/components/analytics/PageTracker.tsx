import { AnalyticsEvents, resolvePageName, track } from "@/lib/analytics";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Émet `page_viewed` à chaque changement de route. */
export function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    const page = resolvePageName(location.pathname);
    track(AnalyticsEvents.PAGE_VIEWED, {
      page,
      path: location.pathname,
      search: location.search || undefined,
    });
  }, [location.pathname, location.search]);

  return null;
}
