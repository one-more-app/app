import { Capacitor } from "@capacitor/core";
import { AppsFlyer } from "appsflyer-capacitor-plugin";

import { isAppsFlyerConfigured } from "@/lib/appsflyer-config";
import { setupAppsFlyer } from "@/lib/appsflyer";

export const AF_EVENTS = {
  COMPLETE_REGISTRATION: "af_complete_registration",
  TUTORIAL_COMPLETION: "af_tutorial_completion",
  PURCHASE: "af_purchase",
  SUBSCRIBE: "af_subscribe",
  START_TRIAL: "af_start_trial",
} as const;

export type AppsFlyerCommerceKind = "trial" | "subscribe" | "purchase";

export function registrationEventName(isNewUser: boolean): string | null {
  return isNewUser ? AF_EVENTS.COMPLETE_REGISTRATION : null;
}

export function resolveCommerceKind(params: {
  isTrial?: boolean;
  subscriptionPeriod?: "monthly" | "yearly" | "lifetime" | "weekly";
  isRenewal?: boolean;
}): AppsFlyerCommerceKind | null {
  if (params.isRenewal) return null;
  if (params.isTrial) return "trial";
  if (
    params.subscriptionPeriod === "monthly" ||
    params.subscriptionPeriod === "yearly" ||
    params.subscriptionPeriod === "weekly"
  ) {
    return "subscribe";
  }
  return "purchase";
}

export function commerceEventName(kind: AppsFlyerCommerceKind): string {
  if (kind === "trial") return AF_EVENTS.START_TRIAL;
  if (kind === "subscribe") return AF_EVENTS.SUBSCRIBE;
  return AF_EVENTS.PURCHASE;
}

export function buildCommerceEventValue(params: {
  revenue?: number;
  currency?: string;
  productId?: string;
}): Record<string, string | number> {
  const value: Record<string, string | number> = {};
  if (params.revenue != null && Number.isFinite(params.revenue)) {
    value.af_revenue = params.revenue;
  }
  if (params.currency) value.af_currency = params.currency;
  if (params.productId) value.af_content_id = params.productId;
  return value;
}

export async function logAppsFlyerEvent(
  eventName: string,
  eventValue?: Record<string, unknown>,
): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isAppsFlyerConfigured()) return;
  // Ne pas bloquer sur le wait ATT de initSDK (jusqu’à 60s) : le start est déjà lancé.
  await Promise.race([
    setupAppsFlyer(),
    new Promise<void>((resolve) => setTimeout(resolve, 1500)),
  ]);
  try {
    await AppsFlyer.logEvent({ eventName, eventValue: eventValue ?? {} });
  } catch {
    // Best effort : un échec AF ne doit pas casser auth / paywall.
  }
}

export function logAppsFlyerRegistrationIfNew(
  isNewUser: boolean,
  method?: string,
): void {
  const eventName = registrationEventName(isNewUser);
  if (!eventName) return;
  void logAppsFlyerEvent(
    eventName,
    method ? { af_registration_method: method } : undefined,
  );
}

export function logAppsFlyerTutorialCompletion(): void {
  void logAppsFlyerEvent(AF_EVENTS.TUTORIAL_COMPLETION);
}

export function logAppsFlyerCommerce(params: {
  isTrial?: boolean;
  subscriptionPeriod?: "monthly" | "yearly" | "lifetime" | "weekly";
  isRenewal?: boolean;
  revenue?: number;
  currency?: string;
  productId?: string;
}): void {
  const kind = resolveCommerceKind(params);
  if (!kind) return;
  void logAppsFlyerEvent(
    commerceEventName(kind),
    buildCommerceEventValue(params),
  );
}
