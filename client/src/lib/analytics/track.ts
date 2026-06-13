import { Capacitor } from "@capacitor/core";
import type { AnalyticsEventName } from "./events";
import { getOpenPanel } from "./instance";

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

export type AnalyticsContext = {
  section?: string;
  feature?: string;
  page?: string;
};

function compactProps(props: AnalyticsProperties): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined) continue;
    out[key] = value;
  }
  return out;
}

function mergeContext(
  props: AnalyticsProperties,
  context?: AnalyticsContext,
): AnalyticsProperties {
  return {
    ...context,
    ...props,
  };
}

export function track(
  event: AnalyticsEventName | string,
  props: AnalyticsProperties = {},
  context?: AnalyticsContext,
): void {
  const op = getOpenPanel();
  if (!op) return;
  op.track(event, compactProps(mergeContext(props, context)));
}

export function identifyUser(params: {
  profileId: string;
  email?: string | null;
  firstName?: string;
  lastName?: string;
  properties?: AnalyticsProperties;
}): void {
  const op = getOpenPanel();
  if (!op) return;
  op.identify({
    profileId: params.profileId,
    email: params.email ?? undefined,
    firstName: params.firstName,
    lastName: params.lastName,
    properties: params.properties
      ? compactProps(params.properties)
      : undefined,
  });
}

export function clearAnalyticsUser(): void {
  getOpenPanel()?.clear();
}

export function setGlobalAnalyticsProperties(props: AnalyticsProperties): void {
  const op = getOpenPanel();
  if (!op) return;
  op.setGlobalProperties(compactProps(props));
}

export function incrementUserProperty(params: {
  profileId: string;
  property: string;
  value?: number;
}): void {
  const op = getOpenPanel();
  if (!op) return;
  op.increment({
    profileId: params.profileId,
    property: params.property,
    value: params.value,
  });
}

export function initGlobalAnalyticsProperties(): void {
  setGlobalAnalyticsProperties({
    platform: Capacitor.isNativePlatform()
      ? Capacitor.getPlatform()
      : "web",
    app_version: import.meta.env.VITE_APP_VERSION ?? "unknown",
    environment: import.meta.env.MODE,
  });
}

/**
 * Attributs déclaratifs OpenPanel (`data-track` + `data-*`).
 * À spreader sur un élément interactif.
 */
export function trackAttrs(
  event: AnalyticsEventName | string,
  props: AnalyticsProperties = {},
  context?: AnalyticsContext,
): Record<string, string> {
  const merged = compactProps(mergeContext(props, context));
  const attrs: Record<string, string> = { "data-track": event };
  for (const [key, value] of Object.entries(merged)) {
    attrs[`data-${key.replace(/_/g, "-")}`] = String(value);
  }
  return attrs;
}
