import { AppTour } from "@/components/AppTour";
import { useTourDomReady } from "@/hooks/use-tour-dom-ready";
import { getJoyrideScrollOffset, getJoyrideShiftPadding } from "@/lib/joyride-config";
import {
  isHomeTourComplete,
  isOnboardingFirstExercisePending,
  isOnboardingTourComplete,
  setHomeTourComplete,
} from "@/lib/storage";
import { UI } from "@/lib/translations";
import { useCallback, useEffect, useMemo } from "react";
import type { Step } from "react-joyride";

type HomeTourProps = {
  pageReady: boolean;
  progressReady: boolean;
  hasTodaySection: boolean;
};

function isOtherAppTourActive(): boolean {
  return isOnboardingFirstExercisePending() && !isOnboardingTourComplete();
}

export function HomeTour({
  pageReady,
  progressReady,
  hasTodaySection,
}: HomeTourProps) {
  const tourEligible =
    pageReady &&
    progressReady &&
    !isHomeTourComplete() &&
    !isOtherAppTourActive();

  const dismissTour = useCallback(() => {
    setHomeTourComplete(true);
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
