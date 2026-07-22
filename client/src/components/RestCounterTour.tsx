import { AppTour } from "@/components/AppTour";
import { useTourDomReady } from "@/hooks/use-tour-dom-ready";
import { getJoyrideShiftPadding } from "@/lib/joyride-config";
import { setRestCounterTourQuickEditStep2Active } from "@/lib/rest-counter-tour-quick-edit";
import {
  startRestCounterTourSpotlightSync,
  stopRestCounterTourSpotlightSync,
  waitForRestCounterTourSpotlightReady,
} from "@/lib/rest-counter-tour-spotlight";
import {
  isOnboardingFirstExercisePending,
  isOnboardingTourComplete,
  isRestCounterTourComplete,
  setRestCounterTourComplete,
} from "@/lib/storage";
import { UI } from "@/lib/translations";
import { useCallback, useEffect, useMemo } from "react";
import { EVENTS, type EventData, type Step } from "react-joyride";

type RestCounterTourProps = {
  /** La barre repos est visible à l'écran. */
  barVisible: boolean;
};

function isOtherAppTourActive(): boolean {
  return isOnboardingFirstExercisePending() && !isOnboardingTourComplete();
}

function endTourQuickEditStep2(): void {
  stopRestCounterTourSpotlightSync();
  setRestCounterTourQuickEditStep2Active(false);
}

const REST_COUNTER_TOUR_TARGETS = [
  '[data-tour="rest-counter"]',
  '[data-tour="rest-counter-target"]',
] as const;

export function RestCounterTour({ barVisible }: RestCounterTourProps) {
  const tourEligible =
    barVisible && !isRestCounterTourComplete() && !isOtherAppTourActive();
  const domReady = useTourDomReady(tourEligible, REST_COUNTER_TOUR_TARGETS);

  const dismissTour = useCallback(() => {
    endTourQuickEditStep2();
    setRestCounterTourComplete(true);
  }, []);

  const steps = useMemo<Step[]>(
    () => [
      {
        target: '[data-tour="rest-counter"]',
        title: UI.restCounterTourTitle,
        content: UI.restCounterTourContent,
        placement: "bottom",
        skipScroll: true,
        floatingOptions: {
          shiftOptions: { padding: getJoyrideShiftPadding() },
        },
      },
      {
        target: '[data-tour="rest-counter-target-zone"]',
        title: UI.restCounterTourQuickEditTitle,
        content: UI.restCounterTourQuickEditContent,
        placement: "bottom",
        skipScroll: true,
        spotlightPadding: 0,
        blockTargetInteraction: false,
        disableFocusTrap: true,
        before: async () => {
          setRestCounterTourQuickEditStep2Active(true);
          await new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          });
          await waitForRestCounterTourSpotlightReady();
          startRestCounterTourSpotlightSync();
        },
        floatingOptions: {
          shiftOptions: { padding: getJoyrideShiftPadding() },
        },
      },
    ],
    [],
  );

  const handleJoyrideEvent = useCallback((data: EventData) => {
    if (
      data.type === EVENTS.STEP_BEFORE &&
      data.index === 0 &&
      data.action === "prev"
    ) {
      endTourQuickEditStep2();
    }
    if (data.type === EVENTS.TOUR_END) {
      endTourQuickEditStep2();
    }
    if (data.type === EVENTS.STEP_AFTER && data.index === 1) {
      startRestCounterTourSpotlightSync();
    }
  }, []);

  useEffect(() => {
    return () => {
      endTourQuickEditStep2();
    };
  }, []);

  return (
    <AppTour
      steps={steps}
      run={tourEligible && domReady}
      continuous
      onFinish={dismissTour}
      onDismiss={dismissTour}
      onJoyrideEvent={handleJoyrideEvent}
    />
  );
}
