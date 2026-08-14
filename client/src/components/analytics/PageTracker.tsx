import {
  AnalyticsEvents,
  OnboardingSteps,
  resolveOnboardingStepFromLocation,
  resolvePageName,
  setGlobalAnalyticsProperties,
  setOnboardingStepGlobalProperty,
  track,
} from "@/lib/analytics";
import {
  isOnboardingFirstExercisePending,
  isOnboardingTourComplete,
} from "@/lib/storage";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Émet `page_viewed` et met à jour `current_page` sur tous les événements. */
export function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    const page = resolvePageName(location.pathname);
    const onboardingStep =
      location.pathname === "/exercises" &&
      isOnboardingFirstExercisePending() &&
      !isOnboardingTourComplete()
        ? OnboardingSteps.FIRST_EXERCISE
        : resolveOnboardingStepFromLocation(
            location.pathname,
            location.search,
          );
    setGlobalAnalyticsProperties({
      current_page: page,
      current_path: location.pathname,
    });
    setOnboardingStepGlobalProperty(onboardingStep);
    track(AnalyticsEvents.PAGE_VIEWED, {
      page,
      path: location.pathname,
      search: location.search || undefined,
      ...(onboardingStep ? { onboarding_step: onboardingStep } : {}),
    });
  }, [location.pathname, location.search]);

  return null;
}
