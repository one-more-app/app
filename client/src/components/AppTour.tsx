import { useTheme } from "@/hooks/use-theme";
import { getAppTourOptions, getAppTourStyles } from "@/lib/app-tour-config";
import { UI } from "@/lib/translations";
import { useMemo } from "react";
import { EVENTS, Joyride, type EventData, type Step } from "react-joyride";

type AppTourProps = {
  steps: Step[];
  run: boolean;
  onFinish?: () => void;
  /** Fermer ou Passer — même effet pour les tours one-shot. */
  onDismiss?: () => void;
  /** Joyride `continuous` — enchaîne les étapes avec Suivant. */
  continuous?: boolean;
};

export function AppTour({
  steps,
  run,
  onFinish,
  onDismiss,
  continuous = false,
}: AppTourProps) {
  const { resolvedTheme } = useTheme();

  const options = useMemo(
    () => getAppTourOptions(resolvedTheme),
    [resolvedTheme],
  );

  const styles = useMemo(
    () => getAppTourStyles(resolvedTheme),
    [resolvedTheme],
  );

  const handleEvent = (data: EventData) => {
    if (data.type !== EVENTS.TOUR_END) return;
    if (data.status === "skipped") {
      onDismiss?.();
      return;
    }
    onFinish?.();
  };

  if (!run || steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={continuous}
      options={{
        ...options,
        buttons: continuous
          ? options.buttons
          : (["close", "primary"] as const),
        closeButtonAction: "skip",
      }}
      styles={styles}
      locale={{
        back: UI.back,
        close: UI.joyrideClose,
        last: UI.joyrideLast,
        next: UI.next,
        skip: UI.joyrideSkip,
        nextWithProgress: UI.joyrideNextWithProgress,
      }}
      onEvent={handleEvent}
    />
  );
}
