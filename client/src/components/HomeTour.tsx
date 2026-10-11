import { AppTour } from "@/components/AppTour";
import { useTourDomReady } from "@/hooks/use-tour-dom-ready";
import { getJoyrideScrollOffset, getJoyrideShiftPadding } from "@/lib/joyride-config";
import {
  isHomeTourComplete,
  isOnboardingFirstExercisePending,
  isOnboardingTourComplete,
  setHomeTourComplete,
  setRankingTourComplete,
} from "@/lib/storage";
import { UI } from "@/lib/translations";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Step } from "react-joyride";

type HomeTourProps = {
  pageReady: boolean;
  progressReady: boolean;
  /** Séance du jour en cours affichée (cible `home-today`). */
  hasLiveSession: boolean;
  /** CTA « Démarrer une séance » affiché (cible `home-start-session`). */
  hasStartCta: boolean;
};

function isOtherAppTourActive(): boolean {
  return isOnboardingFirstExercisePending() && !isOnboardingTourComplete();
}

export function HomeTour({
  pageReady,
  progressReady,
  hasLiveSession,
  hasStartCta,
}: HomeTourProps) {
  const [tourComplete, setTourComplete] = useState(isHomeTourComplete);

  const tourEligible =
    pageReady &&
    progressReady &&
    !tourComplete &&
    !isOtherAppTourActive();

  const dismissTour = useCallback(() => {
    // Avant home complete : sinon RankingTour s’ouvre sur l’event home.
    setRankingTourComplete(true);
    setHomeTourComplete(true);
    setTourComplete(true);
  }, []);

  const steps = useMemo<Step[]>(() => {
    const scrollOffset = getJoyrideScrollOffset();
    const nextSteps: Step[] = [
      {
        target: '[data-tour="home-progress-banner"]',
        title: UI.homeTourProgressTitle,
        content: UI.homeTourProgressContent,
        placement: "bottom",
        skipScroll: true,
        floatingOptions: {
          shiftOptions: { padding: getJoyrideShiftPadding() },
        },
      },
    ];

    nextSteps.push({
      target: '[data-tour="home-week"]',
      title: UI.homeTourWeekTitle,
      content: UI.homeTourWeekContent,
      placement: "bottom",
      skipScroll: true,
      floatingOptions: {
        shiftOptions: { padding: getJoyrideShiftPadding() },
      },
    });

    if (hasLiveSession) {
      nextSteps.push({
        target: '[data-tour="home-today"]',
        title: UI.homeTourTodayTitle,
        content: UI.homeTourTodayContent,
        placement: "bottom",
        scrollOffset,
      });
    }

    if (hasStartCta) {
      nextSteps.push({
        target: '[data-tour="home-start-session"]',
        title: UI.homeTourCtaTitle,
        content: UI.homeTourCtaContent,
        placement: "top",
        skipScroll: true,
        floatingOptions: {
          shiftOptions: { padding: getJoyrideShiftPadding() },
        },
      });
    }

    nextSteps.push(
      {
        target: '[data-tour="nav-exercises"]',
        title: UI.homeTourNavExercisesTitle,
        content: UI.homeTourNavExercisesContent,
        placement: "top",
        skipScroll: true,
        floatingOptions: {
          shiftOptions: { padding: getJoyrideShiftPadding() },
        },
      },
      {
        target: '[data-tour="nav-social"]',
        title: UI.homeTourNavSocialTitle,
        content: UI.homeTourNavSocialContent,
        placement: "top",
        skipScroll: true,
        floatingOptions: {
          shiftOptions: { padding: getJoyrideShiftPadding() },
        },
      },
      {
        target: '[data-tour="nav-settings"]',
        title: UI.homeTourNavSettingsTitle,
        content: UI.homeTourNavSettingsContent,
        placement: "top",
        skipScroll: true,
        floatingOptions: {
          shiftOptions: { padding: getJoyrideShiftPadding() },
        },
      },
    );

    return nextSteps;
  }, [hasLiveSession, hasStartCta]);

  const targets = useMemo(
    () => steps.map((step) => step.target as string),
    [steps],
  );
  const domReady = useTourDomReady(tourEligible, targets);
  const run = tourEligible && domReady;

  useEffect(() => {
    if (!run) return;
    const viewport = document.querySelector(".app-scroll-viewport");
    if (viewport instanceof HTMLElement) {
      viewport.scrollTop = 0;
    }
  }, [run]);

  return (
    <AppTour
      steps={steps}
      run={run}
      continuous
      onFinish={dismissTour}
      onDismiss={dismissTour}
    />
  );
}
