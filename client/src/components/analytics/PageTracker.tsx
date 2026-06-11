import {
  AnalyticsEvents,
  resolvePageName,
  setGlobalAnalyticsProperties,
  track,
} from "@/lib/analytics";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Émet `page_viewed` et met à jour `current_page` sur tous les événements. */
export function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    const page = resolvePageName(location.pathname);
    setGlobalAnalyticsProperties({
      current_page: page,
      current_path: location.pathname,
    });
    track(AnalyticsEvents.PAGE_VIEWED, {
      page,
      path: location.pathname,
      search: location.search || undefined,
    });
  }, [location.pathname, location.search]);

  return null;
}
