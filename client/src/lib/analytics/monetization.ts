import { AnalyticsEvents } from "./events";
import { getOpenPanel } from "./instance";
import { track, type AnalyticsProperties } from "./track";

export type RevenueCurrency = "EUR" | "USD" | "GBP";

export type PurchaseValidatedParams = {
  amount: number;
  currency: RevenueCurrency;
  productId: string;
  provider?: "revenuecat" | "stripe" | "manual";
  subscriptionPeriod?: "monthly" | "yearly" | "lifetime" | "weekly";
  isRenewal?: boolean;
  properties?: AnalyticsProperties;
};

/**
 * Enregistre un revenu validé côté client.
 * Préférer `api/src/analytics` (serveur) pour les achats confirmés — plus fiable.
 * RevenueCat branchera les webhooks sur le service serveur.
 */
export async function trackPurchaseValidated(
  params: PurchaseValidatedParams,
): Promise<void> {
  const op = getOpenPanel();
  const eventProps = {
    product_id: params.productId,
    currency: params.currency,
    provider: params.provider ?? "manual",
    subscription_period: params.subscriptionPeriod,
    is_renewal: params.isRenewal ?? false,
    ...params.properties,
  };

  track(AnalyticsEvents.PURCHASE_VALIDATED, eventProps);

  if (op) {
    await op.revenue(params.amount, {
      currency: params.currency,
      ...eventProps,
    });
  }
}

export function trackPaywallViewed(props: AnalyticsProperties = {}): void {
  track(AnalyticsEvents.PAYWALL_VIEWED, props);
}

export function trackExerciseLimitReached(props: AnalyticsProperties = {}): void {
  track(AnalyticsEvents.EXERCISE_LIMIT_REACHED, props);
}
