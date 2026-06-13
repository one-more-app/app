import { useAnalyticsContext, AnalyticsContextProvider } from "./analytics-context";
import { useMemo } from "react";

type TrackableProps = {
  /** Zone fonctionnelle (ex. `home`, `exercise_card`, `paywall`). */
  section: string;
  /** Sous-fonctionnalité optionnelle. */
  feature?: string;
  children: React.ReactNode;
  className?: string;
  /** Balise HTML du conteneur (défaut : `div`). */
  as?: "div" | "section" | "article" | "main" | "span";
  /** Désactive la capture auto des clics dans cette zone. */
  skipClickCapture?: boolean;
};

/**
 * Enveloppe globale : propage `section` / `feature` à tous les enfants
 * via le contexte analytics. Les appels `useAnalytics().track()` et
 * `trackAttrs()` héritent automatiquement de ce contexte.
 */
export function Trackable({
  section,
  feature,
  children,
  className,
  as: Tag = "div",
  skipClickCapture = false,
}: TrackableProps) {
  const parent = useAnalyticsContext();
  const value = useMemo(
    () => ({
      section,
      feature: feature ?? parent.feature,
      page: parent.page,
    }),
    [section, feature, parent.feature, parent.page],
  );

  return (
    <AnalyticsContextProvider value={value}>
      <Tag
        className={className}
        data-analytics-section={section}
        {...(feature ? { "data-analytics-feature": feature } : {})}
        {...(skipClickCapture ? { "data-analytics-skip": "" } : {})}
      >
        {children}
      </Tag>
    </AnalyticsContextProvider>
  );
}
