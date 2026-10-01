import { UI } from "@/lib/translations";

type PurchasesStoreProduct =
  import("@revenuecat/purchases-capacitor").PurchasesStoreProduct;

type PeriodUnit = "DAY" | "WEEK" | "MONTH" | "YEAR";

function normalizePeriodUnit(unit: string | null | undefined): PeriodUnit | null {
  if (!unit) return null;
  switch (unit.toUpperCase()) {
    case "DAY":
    case "DAYS":
    case "D":
      return "DAY";
    case "WEEK":
    case "WEEKS":
    case "W":
      return "WEEK";
    case "MONTH":
    case "MONTHS":
    case "M":
      return "MONTH";
    case "YEAR":
    case "YEARS":
    case "Y":
      return "YEAR";
    default:
      return null;
  }
}

function parseIsoPeriod(
  iso: string | null | undefined,
): { unit: PeriodUnit; count: number } | null {
  if (!iso) return null;
  const match = iso.trim().match(/^P(\d+)([DWMY])$/i);
  if (!match) return null;
  const count = Number(match[1]);
  const unit = normalizePeriodUnit(match[2]);
  if (!unit || !Number.isFinite(count) || count <= 0) return null;
  return { unit, count };
}

function cyclesOf(cycles: number | null | undefined): number {
  if (typeof cycles !== "number" || !Number.isFinite(cycles) || cycles < 1) {
    return 1;
  }
  return cycles;
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

function labelFromBillingPeriod(
  period: {
    unit?: string | null;
    value?: number | null;
    iso8601?: string | null;
  } | null | undefined,
  cycles: number | null | undefined,
): string | null {
  if (!period) return null;
  const cycleCount = cyclesOf(cycles);
  const unit = normalizePeriodUnit(period.unit);
  if (unit && typeof period.value === "number" && period.value > 0) {
    return formatFreeTrialLabel(unit, period.value * cycleCount);
  }
  const parsed = parseIsoPeriod(period.iso8601);
  if (!parsed) return null;
  return formatFreeTrialLabel(parsed.unit, parsed.count * cycleCount);
}

function labelFromIntro(intro: {
  price: number;
  cycles: number;
  period: string;
  periodUnit: string;
  periodNumberOfUnits: number;
}): string | null {
  if (intro.price !== 0) return null;
  const cycleCount = cyclesOf(intro.cycles);
  const unit = normalizePeriodUnit(intro.periodUnit);
  if (unit && intro.periodNumberOfUnits > 0) {
    return formatFreeTrialLabel(unit, intro.periodNumberOfUnits * cycleCount);
  }
  const parsed = parseIsoPeriod(intro.period);
  if (!parsed) return null;
  return formatFreeTrialLabel(parsed.unit, parsed.count * cycleCount);
}

/**
 * Libellé d'essai gratuit uniquement si l'offre store en contient un.
 * iOS : `introPrice` à 0. Android : `freePhase` de l'option par défaut ou d'une option d'offre.
 * Retourne null quand l'info est absente.
 */
export function getFreeTrialLabel(
  product: PurchasesStoreProduct | null | undefined,
): string | null {
  if (!product) return null;

  const phases = [
    product.defaultOption?.freePhase,
    ...(product.subscriptionOptions ?? []).map((option) => option.freePhase),
  ];
  for (const phase of phases) {
    if (!phase) continue;
    const label = labelFromBillingPeriod(phase.billingPeriod, phase.billingCycleCount);
    if (label) return label;
  }

  if (product.introPrice) {
    const label = labelFromIntro(product.introPrice);
    if (label) return label;
  }

  return null;
}
