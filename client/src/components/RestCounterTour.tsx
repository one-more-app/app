import { AppTour } from "@/components/AppTour";
import { getJoyrideShiftPadding } from "@/lib/joyride-config";
import {
  isRestCounterTourComplete,
  setRestCounterTourComplete,
} from "@/lib/storage";
import { UI } from "@/lib/translations";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Step } from "react-joyride";

type RestCounterTourProps = {
  /** La barre repos est visible à l'écran. */
  barVisible: boolean;
};

function isOtherAppTourActive(searchParams: URLSearchParams): boolean {
  const tour = searchParams.get("tour");
  return tour === "onboarding" || tour === "onboarding-first";
}

export function RestCounterTour({ barVisible }: RestCounterTourProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [domReady, setDomReady] = useState(false);

  const otherTourActive = isOtherAppTourActive(searchParams);
  const tourEligible =
    barVisible && !isRestCounterTourComplete() && !otherTourActive;

  const dismissTour = useCallback(() => {
    setRestCounterTourComplete(true);
    setDomReady(false);
  }, []);

  const goToSettings = useCallback(() => {
    dismissTour();
    navigate("/settings?focus=rest-time");
  }, [dismissTour, navigate]);

  const steps = useMemo<Step[]>(
    () => [
      {
        target: '[data-tour="rest-counter"]',
        title: UI.restCounterTourTitle,
        content: (
          <div className="space-y-3">
            <p>{UI.restCounterTourContent}</p>
            <button
              type="button"
              className="text-sm font-medium text-accent underline-offset-2 hover:underline"
              onClick={goToSettings}
            >
              {UI.restCounterTourSettingsLink}
            </button>
          </div>
        ),
        placement: "bottom",
        skipScroll: true,
        floatingOptions: {
          shiftOptions: { padding: getJoyrideShiftPadding() },
        },
      },
    ],
    [goToSettings],
  );

  useEffect(() => {
    if (!tourEligible) return undefined;

    const timer = window.setTimeout(() => {
      if (document.querySelector('[data-tour="rest-counter"]')) {
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
      onFinish={dismissTour}
      onDismiss={dismissTour}
    />
  );
}
