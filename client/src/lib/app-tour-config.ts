import { getJoyrideScrollOffset } from "@/lib/joyride-config";
import type { ResolvedTheme } from "@/hooks/use-theme";
import type { PartialDeep, Styles } from "react-joyride";

export function getAppTourOptions(resolvedTheme: ResolvedTheme) {
  return {
    arrowColor: "var(--card)",
    backgroundColor: "var(--card)",
    textColor: "var(--card-foreground)",
    primaryColor: "var(--accent)",
    overlayColor:
      resolvedTheme === "dark"
        ? "oklch(0.04 0 0 / 0.82)"
        : "oklch(0.2 0 0 / 0.5)",
    spotlightPadding: 10,
    spotlightRadius: 14,
    zIndex: 120,
    showProgress: true,
    skipBeacon: true,
    scrollOffset: getJoyrideScrollOffset(),
    buttons: ["back", "close", "primary", "skip"] as const,
  };
}

export function getAppTourStyles(
  resolvedTheme: ResolvedTheme,
): PartialDeep<Styles> {
  return {
    tooltip: {
      backgroundColor: "var(--card)",
      color: "var(--card-foreground)",
      borderRadius: "var(--radius-xl)",
      border: "1px solid var(--border)",
      boxShadow:
        resolvedTheme === "dark"
          ? "0 16px 48px oklch(0 0 0 / 0.55), 0 0 0 1px oklch(1 0 0 / 0.06)"
          : "0 16px 40px oklch(0 0 0 / 0.14), 0 0 0 1px oklch(0 0 0 / 0.05)",
      fontFamily: "var(--font-sans)",
      padding: "1rem 1rem 0.75rem",
    },
    tooltipContainer: {
      textAlign: "left" as const,
    },
    tooltipTitle: {
      fontFamily: "var(--font-one-more)",
      fontStyle: "italic",
      textTransform: "uppercase" as const,
      letterSpacing: "0.04em",
      fontSize: "0.9375rem",
      color: "var(--card-foreground)",
      marginBottom: "0.35rem",
    },
    tooltipContent: {
      color: "var(--muted-foreground)",
      fontSize: "0.875rem",
      lineHeight: 1.55,
      padding: "0.25rem 0 0",
    },
    tooltipFooter: {
      marginTop: "0.75rem",
      paddingTop: "0.75rem",
      borderTop: "1px solid var(--border)",
      gap: "0.5rem",
    },
    buttonPrimary: {
      backgroundColor: "var(--accent)",
      color: "var(--accent-foreground)",
      borderRadius: "var(--radius-md)",
      fontFamily: "var(--font-one-more)",
      fontSize: "0.75rem",
      fontWeight: 600,
      textTransform: "uppercase" as const,
      letterSpacing: "0.06em",
      padding: "0.5rem 1rem",
      outline: "none",
    },
    buttonBack: {
      color: "var(--muted-foreground)",
      borderRadius: "var(--radius-md)",
      fontSize: "0.8125rem",
      padding: "0.5rem 0.75rem",
      marginRight: "auto",
    },
    buttonSkip: {
      color: "var(--muted-foreground)",
      fontSize: "0.8125rem",
      padding: "0.5rem 0.5rem",
    },
    buttonClose: {
      color: "var(--muted-foreground)",
      height: "0.75rem",
      width: "0.75rem",
      padding: "0.75rem",
      borderRadius: "var(--radius-md)",
    },
  };
}
