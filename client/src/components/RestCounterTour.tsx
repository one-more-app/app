import { AppTour } from "@/components/AppTour";
import { getJoyrideShiftPadding } from "@/lib/joyride-config";
import {
  isRestCounterTourComplete,
  setRestCounterTourComplete,
} from "@/lib/storage";
import { UI } from "@/lib/translations";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EVENTS, type EventData, type Step } from "react-joyride";

type RestCounterTourProps = {
  /** La barre repos est visible à l'écran. */
  barVisible: boolean;
  /** Étape 2 : ouvrir le panneau d'édition rapide en mode inline (dans la zone spotlight). */
  onQuickEditStep?: () => void;
  /** Fin ou abandon du tour : fermer le panneau. */
  onTourEnd?: () => void;
};

function isOtherAppTourActive(searchParams: URLSearchParams): boolean {
  const tour = searchParams.get("tour");
  return tour === "onboarding" || tour === "onboarding-first";
}

async function waitForTourZoneReady(): Promise<void> {
  return new Promise((resolve) => {
    const deadline = Date.now() + 800;
    const tick = () => {
      const zone = document.querySelector(
        '[data-tour="rest-counter-target-zone"]',
      );
      const panel = document.querySelector(
        '[data-tour="rest-counter-target-panel"]',
      );
      if (zone && panel && zone.getBoundingClientRect().height > 50) {
        resolve();
        return;
      }
      if (Date.now() > deadline) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

export function RestCounterTour({
  barVisible,
  onQuickEditStep,
  onTourEnd,
}: RestCounterTourProps) {
  const [searchParams] = useSearchParams();
  const [domReady, setDomReady] = useState(false);

  const otherTourActive = isOtherAppTourActive(searchParams);
  const tourEligible =
    barVisible && !isRestCounterTourComplete() && !otherTourActive;

  const dismissTour = useCallback(() => {
    setRestCounterTourComplete(true);
    setDomReady(false);
    onTourEnd?.();
  }, [onTourEnd]);

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
        spotlightPadding: 8,
        blockTargetInteraction: false,
        disableFocusTrap: true,
        before: async () => {
          onQuickEditStep?.();
          await waitForTourZoneReady();
        },
        floatingOptions: {
          shiftOptions: { padding: getJoyrideShiftPadding() },
        },
      },
    ],
    [onQuickEditStep],
  );

  const handleJoyrideEvent = useCallback(
    (data: EventData) => {
      if (
        data.type === EVENTS.STEP_BEFORE &&
        data.index === 0 &&
        data.action === "prev"
      ) {
        onTourEnd?.();
      }
      if (data.type === EVENTS.TOUR_END) {
        onTourEnd?.();
      }
    },
    [onTourEnd],
  );

  useEffect(() => {
    if (!tourEligible) return undefined;

    const timer = window.setTimeout(() => {
      if (
        document.querySelector('[data-tour="rest-counter"]') &&
        document.querySelector('[data-tour="rest-counter-target-zone"]')
      ) {
        setDomReady(true);
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
      setDomReady(false);
    };
  }, [tourEligible]);

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
