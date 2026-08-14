import { AnalyticsClickCapture } from "./AnalyticsClickCapture";
import { AnalyticsContextProvider } from "./analytics-context";
import { PageTracker } from "./PageTracker";
import {
  AnalyticsEvents,
  clearAnalyticsUser,
  getOnboardingLastStep,
  getOnboardingSignupMethod,
  identifyUser,
  incrementUserProperty,
  initGlobalAnalyticsProperties,
  isOpenPanelConfigured,
  resolvePageName,
  track,
} from "@/lib/analytics";
import { useAuth } from "@/hooks/use-auth";
import { useAccess } from "@/hooks/use-access";
import { isOnboardingMarkedDone } from "@/lib/storage";
import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Initialise OpenPanel, identifie l'utilisateur connecté,
 * propage le contexte de page, et met à jour les propriétés de profil.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { access } = useAccess();
  const location = useLocation();
  const identifiedRef = useRef<string | null>(null);

  const pageContext = useMemo(
    () => ({ page: resolvePageName(location.pathname) }),
    [location.pathname],
  );

  useEffect(() => {
    if (!isOpenPanelConfigured()) return;
    initGlobalAnalyticsProperties();
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
    if (identifiedRef.current === userId) return;

    identifyUser({
      profileId: userId,
      email: auth.user.email,
      properties: {
        exercise_limit: access?.exerciseLimit ?? "unknown",
        referral_count: access?.referralCount ?? 0,
        onboarding_last_step: getOnboardingLastStep(),
        onboarding_completed: isOnboardingMarkedDone(),
        signup_method: getOnboardingSignupMethod(),
      },
    });
    incrementUserProperty({
      profileId: userId,
      property: "session_count",
      value: 1,
    });
    identifiedRef.current = userId;
  }, [auth.status, auth.user, access?.exerciseLimit, access?.referralCount]);

  useEffect(() => {
    if (!isOpenPanelConfigured()) return;
    if (auth.status !== "authenticated" || !auth.user || !access) return;

    identifyUser({
      profileId: auth.user.id,
      email: auth.user.email,
      properties: {
        exercise_count: access.activeExerciseCount,
        exercise_limit: access.exerciseLimit,
        referral_count: access.referralCount,
        has_used_referral_code: access.hasUsedReferralCode,
        onboarding_last_step: getOnboardingLastStep(),
        onboarding_completed: isOnboardingMarkedDone(),
        signup_method: getOnboardingSignupMethod(),
      },
    });
  }, [auth.status, auth.user, access]);

  return (
    <AnalyticsContextProvider value={pageContext}>
      <PageTracker />
      <AnalyticsClickCapture>{children}</AnalyticsClickCapture>
    </AnalyticsContextProvider>
  );
}
