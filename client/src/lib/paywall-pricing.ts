function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/** Équivalent mensuel du prix annuel, arrondi au centime. */
export function monthlyPriceFromAnnual(annualAmount: number): number {
  if (!Number.isFinite(annualAmount) || annualAmount <= 0) return 0;
  return Math.round(toCents(annualAmount) / 12) / 100;
}

export function formatOfferPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency || "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export type AnnualDisplayPrices = {
  price: string;
  perMonth: string;
};

type AnnualProductPrice = {
  price: number;
  priceString: string;
  currencyCode?: string | null;
};

/** Affiche le prix annuel store brut et son équivalent mensuel. */
export function describeAnnualDisplay(
  product: AnnualProductPrice,
): AnnualDisplayPrices {
  const currency = product.currencyCode || "EUR";
  if (typeof product.price !== "number" || !Number.isFinite(product.price)) {
    return {
      price: product.priceString,
      perMonth: product.priceString,
    };
  }
  return {
    price: formatOfferPrice(product.price, currency),
    perMonth: formatOfferPrice(monthlyPriceFromAnnual(product.price), currency),
  };
}

/**
 * Pourcentage d'économie de l'annuel vs 12× le mensuel.
 * Retourne null si les prix sont invalides ou si l'annuel n'est pas moins cher.
 */
export function annualSavingsPercent(
  annualPrice: number,
  monthlyPrice: number,
): number | null {
  if (
    !Number.isFinite(annualPrice) ||
    !Number.isFinite(monthlyPrice) ||
    annualPrice <= 0 ||
    monthlyPrice <= 0
  ) {
    return null;
  }
  const yearlyIfMonthly = toCents(monthlyPrice) * 12;
  const annualCents = toCents(annualPrice);
  if (yearlyIfMonthly <= annualCents) return null;
  return Math.round(((yearlyIfMonthly - annualCents) / yearlyIfMonthly) * 100);
}
