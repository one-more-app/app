import {
  AnalyticsEvents,
  OnboardingSteps,
  resolveOnboardingStepFromLocation,
  resolvePageName,
  setGlobalAnalyticsProperties,
  setOnboardingStepGlobalProperty,
  track,
  trackExerciseOpened,
} from "@/lib/analytics";
import {
  isOnboardingFirstExercisePending,
  isOnboardingTourComplete,
} from "@/lib/storage";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type ExerciseDetailLocationState = {
  fromAddExercise?: boolean;
};

/** Page précédente pour attribuer la source de `exercise_opened`. */
let previousPageName: string | null = null;

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

    if (page === "exercise_detail") {
      const trackedExerciseId = location.pathname.replace(/^\/exercise\//, "");
      const fromAdd =
        (location.state as ExerciseDetailLocationState | null)?.fromAddExercise ===
        true;
      if (trackedExerciseId) {
        trackExerciseOpened({
          trackedExerciseId,
          source: previousPageName ?? "direct",
          fromAdd,
        });
      }
    }

    previousPageName = page;

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
  }, [location.pathname, location.search, location.state]);

  return null;
}
