import { AnalyticsEvents } from "./events";
import { track } from "./track";

export function trackDialogOpenChange(
  open: boolean,
  label: string | undefined,
  onOpenChange?: (open: boolean) => void,
): void {
  track(open ? AnalyticsEvents.DIALOG_OPENED : AnalyticsEvents.DIALOG_CLOSED, {
    dialog: label ?? "unnamed",
  });
  onOpenChange?.(open);
}

export function trackDrawerOpenChange(
  open: boolean,
  label: string | undefined,
  onOpenChange?: (open: boolean) => void,
): void {
  track(open ? AnalyticsEvents.DRAWER_OPENED : AnalyticsEvents.DRAWER_CLOSED, {
    drawer: label ?? "unnamed",
  });
  onOpenChange?.(open);
}
