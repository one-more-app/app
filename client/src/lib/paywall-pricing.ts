const DEFAULT_ANNUAL_GIFTS_VALUE = 30;

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function readAnnualGiftsValue(
  metadata: Record<string, unknown> | null | undefined,
): number {
  if (!metadata || !Object.prototype.hasOwnProperty.call(metadata, "annualGiftsValue")) {
    return DEFAULT_ANNUAL_GIFTS_VALUE;
  }
  const value = metadata.annualGiftsValue;
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.replace(",", ".").trim())
        : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_ANNUAL_GIFTS_VALUE;
  return parsed;
}

/** Prix annuel affiché après déduction des cadeaux. Jamais négatif, au centime près. */
export function annualPriceAfterGifts(price: number, giftsValue: number): number {
  if (!Number.isFinite(price)) return 0;
  const gifts = Number.isFinite(giftsValue) ? Math.max(0, giftsValue) : 0;
  return Math.max(0, toCents(price) - toCents(gifts)) / 100;
}

/** Équivalent mensuel du prix annuel net, arrondi au centime. */
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

/** Montant marketing compact, ex. "30€" ou "29,99€". */
export function formatGiftAmount(amount: number, currency = "EUR"): string {
  if (!Number.isFinite(amount) || amount < 0) return formatGiftAmount(0, currency);
  if (Number.isInteger(amount) && currency.toUpperCase() === "EUR") {
    return `${amount}€`;
  }
  return formatOfferPrice(amount, currency).replace(/[\s\u00a0\u202f]/g, "");
}

export type AnnualDisplayPrices = {
  price: string;
  oldPrice?: string;
  perMonth: string;
};

type AnnualProductPrice = {
  price: number;
  priceString: string;
  currencyCode?: string | null;
};

export function describeAnnualDisplay(
  product: AnnualProductPrice,
  giftsValue: number,
): AnnualDisplayPrices {
  const currency = product.currencyCode || "EUR";
  if (typeof product.price !== "number" || !Number.isFinite(product.price)) {
    return {
      price: product.priceString,
      perMonth: product.priceString,
    };
  }
  const net = annualPriceAfterGifts(product.price, giftsValue);
  const discounted = toCents(net) < toCents(product.price);
  return {
    price: formatOfferPrice(net, currency),
    oldPrice: discounted ? product.priceString : undefined,
    perMonth: formatOfferPrice(monthlyPriceFromAnnual(net), currency),
  };
}
