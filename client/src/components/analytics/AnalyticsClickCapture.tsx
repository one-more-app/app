import { useAnalyticsContext } from "./analytics-context";
import {
  AnalyticsEvents,
  findInteractiveElement,
  isOpenPanelConfigured,
  resolveAnalyticsFeature,
  resolveAnalyticsSection,
  resolveClickLabel,
  shouldSkipAutoClickTrack,
  track,
} from "@/lib/analytics";
import { useEffect } from "react";

/**
 * Capture globale de tous les clics interactifs (boutons, liens, tabs…).
 * Les nouveaux composants héritent du tracking sans code supplémentaire.
 */
export function AnalyticsClickCapture({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = useAnalyticsContext();

  useEffect(() => {
    if (!isOpenPanelConfigured()) return;

    const handleClick = (event: MouseEvent) => {
      const el = findInteractiveElement(event.target);
      if (!el || shouldSkipAutoClickTrack(el)) return;

      const label = resolveClickLabel(el);
      const section = resolveAnalyticsSection(el) ?? context.section;
      const feature = resolveAnalyticsFeature(el) ?? context.feature;

      track(AnalyticsEvents.UI_ELEMENT_CLICKED, {
        element: label,
        tag: el.tagName.toLowerCase(),
        slot: el.getAttribute("data-slot") ?? undefined,
        variant: el.getAttribute("data-variant") ?? undefined,
        href: el instanceof HTMLAnchorElement ? el.getAttribute("href") ?? undefined : undefined,
        section,
        feature,
        page: context.page,
      });
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [context.section, context.feature, context.page]);

  return <>{children}</>;
}
