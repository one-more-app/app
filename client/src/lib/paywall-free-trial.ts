import { UI } from "@/lib/translations";

type PurchasesStoreProduct =
  import("@revenuecat/purchases-capacitor").PurchasesStoreProduct;

type PeriodUnit = "DAY" | "WEEK" | "MONTH" | "YEAR";

function normalizePeriodUnit(unit: string | null | undefined): PeriodUnit | null {
  if (!unit) return null;
  const normalized = unit.toUpperCase();
  if (
    normalized === "DAY" ||
    normalized === "WEEK" ||
    normalized === "MONTH" ||
    normalized === "YEAR"
  ) {
    return normalized;
  }
  return null;
}

function formatFreeTrialLabel(unit: PeriodUnit, count: number): string | null {
  if (!Number.isFinite(count) || count <= 0) return null;

  switch (unit) {
    case "DAY":
      return count === 1
        ? UI.paywallFreeTrialDay
        : UI.paywallFreeTrialDays.replace("{count}", String(count));
    case "WEEK":
      return count === 1
        ? UI.paywallFreeTrialWeek
        : UI.paywallFreeTrialWeeks.replace("{count}", String(count));
    case "MONTH":
      return count === 1
        ? UI.paywallFreeTrialMonth
        : UI.paywallFreeTrialMonths.replace("{count}", String(count));
    case "YEAR":
      return count === 1
        ? UI.paywallFreeTrialYear
        : UI.paywallFreeTrialYears.replace("{count}", String(count));
  }
}

/**
 * Libellé d'essai gratuit si le produit store en propose un pour cet utilisateur.
 * iOS : `introPrice` à 0 €. Android : `defaultOption.freePhase`.
 */
export function getFreeTrialLabel(
  product: PurchasesStoreProduct | null | undefined,
): string | null {
  if (!product) return null;

  const freePhase = product.defaultOption?.freePhase;
  if (freePhase) {
    const unit = normalizePeriodUnit(freePhase.billingPeriod.unit);
    if (unit) {
      const cycles = freePhase.billingCycleCount ?? 1;
      const totalUnits = freePhase.billingPeriod.value * Math.max(1, cycles);
      const label = formatFreeTrialLabel(unit, totalUnits);
      if (label) return label;
    }
  }

  const intro = product.introPrice;
  if (intro && intro.price === 0) {
    const unit = normalizePeriodUnit(intro.periodUnit);
    if (unit) {
      const totalUnits = intro.periodNumberOfUnits * Math.max(1, intro.cycles);
      return formatFreeTrialLabel(unit, totalUnits);
    }
  }

  return null;
}
