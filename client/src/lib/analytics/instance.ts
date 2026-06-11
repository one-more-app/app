import { OpenPanel } from "@openpanel/web";
import { getOpenPanelApiUrl, getOpenPanelClientId, isOpenPanelConfigured } from "./config";

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
    });
  }
  return instance;
}
