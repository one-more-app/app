const DEFAULT_REVENUE_CURRENCY = 'EUR';

export type RevenueCatEventRevenue = {
  amount: number;
  currency: string;
};

/**
 * Extrait le montant et la devise depuis un event webhook RevenueCat.
 * Préfère price_in_purchased_currency (devise réelle) à price (USD RC).
 */
export function extractRevenueFromRevenueCatEvent(
  event: Record<string, unknown>,
): RevenueCatEventRevenue | null {
  const currencyRaw = event.currency;
  const currency =
    typeof currencyRaw === 'string' && currencyRaw.trim()
      ? currencyRaw.trim().toUpperCase()
      : DEFAULT_REVENUE_CURRENCY;

  const purchased = event.price_in_purchased_currency;
  const usd = event.price;

  const amount =
    typeof purchased === 'number' && Number.isFinite(purchased)
      ? purchased
      : typeof usd === 'number' && Number.isFinite(usd)
        ? usd
        : null;

  if (amount === null) return null;
  return { amount, currency };
}
