import { AppTour } from "@/components/AppTour";
import { getJoyrideScrollOffset, getJoyrideShiftPadding } from "@/lib/joyride-config";
import {
  isHomeTourComplete,
  isOnboardingFirstExercisePending,
  isOnboardingTourComplete,
  setHomeTourComplete,
} from "@/lib/storage";
import { UI } from "@/lib/translations";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Step } from "react-joyride";

type HomeTourProps = {
  pageReady: boolean;
  progressReady: boolean;
  hasTodaySection: boolean;
};

function isOtherAppTourActive(): boolean {
  return isOnboardingFirstExercisePending() && !isOnboardingTourComplete();
}

const HOME_TOUR_TARGETS = [
  '[data-tour="home-progress-banner"]',
  '[data-tour="home-today"]',
  '[data-tour="home-browse"]',
  '[data-tour="nav-profile"]',
  '[data-tour="nav-history"]',
  '[data-tour="nav-friends"]',
] as const;

export function HomeTour({
  pageReady,
  progressReady,
  hasTodaySection,
}: HomeTourProps) {
  const [domReady, setDomReady] = useState(false);

  const otherTourActive = isOtherAppTourActive();
  const tourEligible =
    pageReady &&
    progressReady &&
    !isHomeTourComplete() &&
    !otherTourActive;

  const dismissTour = useCallback(() => {
    setHomeTourComplete(true);
    setDomReady(false);
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

    if (hasTodaySection) {
      nextSteps.push({
        target: '[data-tour="home-today"]',
        title: UI.homeTourTodayTitle,
        content: UI.homeTourTodayContent,
        placement: "bottom",
        scrollOffset,
      });
    }

    nextSteps.push(
      {
        target: '[data-tour="home-browse"]',
        title: UI.homeTourBrowseTitle,
        content: UI.homeTourBrowseContent,
        placement: "top",
        scrollOffset,
      },
      {
        target: '[data-tour="nav-profile"]',
        title: UI.homeTourNavProfileTitle,
        content: UI.homeTourNavProfileContent,
        placement: "top",
        skipScroll: true,
        floatingOptions: {
          shiftOptions: { padding: getJoyrideShiftPadding() },
        },
      },
      {
        target: '[data-tour="nav-history"]',
        title: UI.homeTourNavHistoryTitle,
        content: UI.homeTourNavHistoryContent,
        placement: "top",
        skipScroll: true,
        floatingOptions: {
          shiftOptions: { padding: getJoyrideShiftPadding() },
        },
      },
      {
        target: '[data-tour="nav-friends"]',
        title: UI.homeTourNavFriendsTitle,
        content: UI.homeTourNavFriendsContent,
        placement: "top",
        skipScroll: true,
        floatingOptions: {
          shiftOptions: { padding: getJoyrideShiftPadding() },
        },
      },
    );

    return nextSteps;
  }, [hasTodaySection]);

  useEffect(() => {
    if (!tourEligible) return undefined;

    const timer = window.setTimeout(() => {
      const requiredTargets = hasTodaySection
        ? HOME_TOUR_TARGETS
        : HOME_TOUR_TARGETS.filter((selector) => selector !== '[data-tour="home-today"]');
      if (requiredTargets.every((selector) => document.querySelector(selector))) {
        setDomReady(true);
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
      setDomReady(false);
    };
  }, [tourEligible, hasTodaySection]);

  useEffect(() => {
    if (!tourEligible || !domReady) return;
    const viewport = document.querySelector(".app-scroll-viewport");
    if (viewport instanceof HTMLElement) {
      viewport.scrollTop = 0;
    }
  }, [tourEligible, domReady]);

  return (
    <AppTour
      steps={steps}
      run={tourEligible && domReady}
      continuous
      onFinish={dismissTour}
      onDismiss={dismissTour}
    />
  );
}
