import { AppTour } from "@/components/AppTour";
import { useTourDomReady } from "@/hooks/use-tour-dom-ready";
import { getJoyrideShiftPadding } from "@/lib/joyride-config";
import {
  isHomeTourComplete,
  isOnboardingFirstExercisePending,
  isOnboardingTourComplete,
  isRankingTourComplete,
  setRankingTourComplete,
  subscribeHomeTourComplete,
} from "@/lib/storage";
import { UI } from "@/lib/translations";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Step } from "react-joyride";

const RANKING_TOUR_TARGETS = ['[data-tour="nav-social"]'] as const;

/**
 * Tour one-shot pour les utilisateurs qui ont déjà vu le home tour
 * avant l'ajout du classement. Les nouveaux users voient l'étape dans HomeTour.
 */
export function RankingTour({ navVisible }: { navVisible: boolean }) {
  const [homeTourComplete, setHomeTourCompleteState] = useState(
    isHomeTourComplete,
  );
  const [rankingTourComplete, setRankingTourCompleteState] = useState(
    isRankingTourComplete,
  );

  useEffect(() => {
    return subscribeHomeTourComplete(() => {
      setHomeTourCompleteState(isHomeTourComplete());
      // Relire après l’event : le home tour marque aussi ranking complete.
      setRankingTourCompleteState(isRankingTourComplete());
    });
  }, []);

  const blockedByOnboarding =
    isOnboardingFirstExercisePending() && !isOnboardingTourComplete();

  const tourEligible =
    navVisible &&
    homeTourComplete &&
    !rankingTourComplete &&
    !blockedByOnboarding;

  const dismissTour = useCallback(() => {
    setRankingTourComplete(true);
    setRankingTourCompleteState(true);
  }, []);

  const steps = useMemo<Step[]>(
    () => [
      {
        target: '[data-tour="nav-social"]',
        title: UI.rankingTourTitle,
        content: UI.rankingTourContent,
        placement: "top",
        skipScroll: true,
        floatingOptions: {
          shiftOptions: { padding: getJoyrideShiftPadding() },
        },
      },
    ],
    [],
  );

  const domReady = useTourDomReady(tourEligible, RANKING_TOUR_TARGETS);

  return (
    <AppTour
      steps={steps}
      run={tourEligible && domReady}
      onFinish={dismissTour}
      onDismiss={dismissTour}
    />
  );
}
