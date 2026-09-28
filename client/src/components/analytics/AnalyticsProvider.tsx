import { AnalyticsClickCapture } from "./AnalyticsClickCapture";
import { AnalyticsContextProvider } from "./analytics-context";
import { PageTracker } from "./PageTracker";
import {
  AnalyticsEvents,
  buildIdentifyTraits,
  buildUsageIdentifyProperties,
  clearAnalyticsUser,
  identifyUser,
  incrementUserProperty,
  initGlobalAnalyticsProperties,
  isOpenPanelConfigured,
  resolvePageName,
  syncPendingAttributionToOpenPanel,
  track,
} from "@/lib/analytics";
import { useAuth } from "@/hooks/use-auth";
import { useAccess } from "@/hooks/use-access";
import { useUserProfileData } from "@/hooks/use-api-data";
import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Initialise OpenPanel, identifie l'utilisateur connecté,
 * propage le contexte de page, et met à jour les propriétés de profil.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { access } = useAccess();
  const { data: profile } = useUserProfileData();
  const location = useLocation();
  const identifiedRef = useRef<string | null>(null);

  const pageContext = useMemo(
    () => ({ page: resolvePageName(location.pathname) }),
    [location.pathname],
  );

  useEffect(() => {
    if (!isOpenPanelConfigured()) return;
    initGlobalAnalyticsProperties();
    // OpenPanel est prêt : rejouer pending AF / UTM URL pour l’Overview Sources.
    syncPendingAttributionToOpenPanel();
  }, []);

  useEffect(() => {
    if (!isOpenPanelConfigured()) return;

    if (auth.status !== "authenticated" || !auth.user) {
      if (identifiedRef.current) {
        track(AnalyticsEvents.USER_LOGGED_OUT);
        clearAnalyticsUser();
        identifiedRef.current = null;
      }
      return;
    }

    const userId = auth.user.id;
    const traits = buildIdentifyTraits(profile);
    const properties = buildUsageIdentifyProperties({ access, profile });

    if (identifiedRef.current !== userId) {
      identifyUser({
        profileId: userId,
        email: auth.user.email,
        ...traits,
        properties,
      });
      incrementUserProperty({
        profileId: userId,
        property: "session_count",
        value: 1,
      });
      identifiedRef.current = userId;
      return;
    }

    // Refresh traits quand access / profil évoluent (premium, limites, etc.).
    identifyUser({
      profileId: userId,
      email: auth.user.email,
      ...traits,
      properties,
    });
  }, [auth.status, auth.user, access, profile]);

  return (
    <AnalyticsContextProvider value={pageContext}>
      <PageTracker />
      <AnalyticsClickCapture>{children}</AnalyticsClickCapture>
    </AnalyticsContextProvider>
  );
}
