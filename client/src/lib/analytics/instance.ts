import { OpenPanel } from "@openpanel/web";
import {
  getOpenPanelApiUrl,
  getOpenPanelClientId,
  isOpenPanelConfigured,
  isSessionReplayEnabled,
} from "./config";

let instance: OpenPanel | null = null;

export function getOpenPanel(): OpenPanel | null {
  if (!isOpenPanelConfigured()) return null;
  if (!instance) {
    instance = new OpenPanel({
      clientId: getOpenPanelClientId()!,
      apiUrl: getOpenPanelApiUrl(),
      trackScreenViews: true,
      trackOutgoingLinks: true,
      trackAttributes: true,
      trackHashChanges: true,
      disabled: false,
      sessionReplay: isSessionReplayEnabled()
        ? {
            enabled: true,
            maskAllInputs: true,
            maskAllText: false,
            blockSelector: "[data-openpanel-replay-block]",
          }
        : undefined,
    });
  }
  return instance;
}
