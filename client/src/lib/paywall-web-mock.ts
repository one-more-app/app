import { Capacitor } from "@capacitor/core";

type PurchasesPackage =
  import("@revenuecat/purchases-capacitor").PurchasesPackage;
type PurchasesOffering =
  import("@revenuecat/purchases-capacitor").PurchasesOffering;
type PurchasesStoreProduct =
  import("@revenuecat/purchases-capacitor").PurchasesStoreProduct;

export type MockCurrentOffering = {
  offering: PurchasesOffering;
  annual: PurchasesPackage | null;
  monthly: PurchasesPackage | null;
};

/**
 * Mock paywall web (Vite DEV uniquement).
 * - ON par défaut hors Capacitor en `import.meta.env.DEV`
 * - OFF avec `VITE_PAYWALL_WEB_MOCK=false`
 * - Jamais en build prod / preview Playwright
 */
export function isPaywallWebMockEnabled(): boolean {
  if (Capacitor.isNativePlatform()) return false;
  if (!import.meta.env.DEV) return false;
  const flag = String(import.meta.env.VITE_PAYWALL_WEB_MOCK ?? "")
    .trim()
    .toLowerCase();
  if (flag === "false" || flag === "0" || flag === "off" || flag === "no") {
    return false;
  }
  return true;
}

function mockProduct(params: {
  identifier: string;
  title: string;
  price: number;
  priceString: string;
  pricePerMonth: number | null;
  pricePerMonthString: string | null;
  subscriptionPeriod: string;
  introDays?: number;
}): PurchasesStoreProduct {
  const introPrice =
    params.introDays && params.introDays > 0
      ? {
          price: 0,
          priceString: "0,00 €",
          cycles: 1,
          period: `P${params.introDays}D`,
          periodUnit: "DAY",
          periodNumberOfUnits: params.introDays,
        }
      : null;

  return {
    identifier: params.identifier,
    description: params.title,
    title: params.title,
    price: params.price,
    priceString: params.priceString,
    pricePerWeek: null,
    pricePerMonth: params.pricePerMonth,
    pricePerYear: null,
    pricePerWeekString: null,
    pricePerMonthString: params.pricePerMonthString,
    pricePerYearString: null,
    currencyCode: "EUR",
    introPrice,
    discounts: null,
    productCategory: "SUBSCRIPTION",
    productType: "AUTO_RENEWABLE_SUBSCRIPTION",
    subscriptionPeriod: params.subscriptionPeriod,
    defaultOption: null,
    subscriptionOptions: null,
    presentedOfferingContext: {
      offeringIdentifier: "web_mock",
      placementIdentifier: null,
      targetingContext: null,
    },
  } as unknown as PurchasesStoreProduct;
}

function mockPackage(params: {
  identifier: string;
  packageType: "ANNUAL" | "MONTHLY";
  product: PurchasesStoreProduct;
}): PurchasesPackage {
  return {
    identifier: params.identifier,
    packageType: params.packageType,
    product: params.product,
    offeringIdentifier: "web_mock",
    presentedOfferingContext: {
      offeringIdentifier: "web_mock",
      placementIdentifier: null,
      targetingContext: null,
    },
    webCheckoutUrl: null,
  } as unknown as PurchasesPackage;
}

export function getMockCurrentOffering(): MockCurrentOffering {
  const annualProduct = mockProduct({
    identifier: "one_more_annual_web_mock",
    title: "One More Annuel (mock)",
    price: 29.99,
    priceString: "29,99 €",
    pricePerMonth: 2.5,
    pricePerMonthString: "2,50 €",
    subscriptionPeriod: "P1Y",
  });
  const monthlyProduct = mockProduct({
    identifier: "one_more_monthly_web_mock",
    title: "One More Mensuel (mock)",
    price: 2.99,
    priceString: "2,99 €",
    pricePerMonth: 2.99,
    pricePerMonthString: "2,99 €",
    subscriptionPeriod: "P1M",
  });

  const annual = mockPackage({
    identifier: "$rc_annual",
    packageType: "ANNUAL",
    product: annualProduct,
  });
  const monthly = mockPackage({
    identifier: "$rc_monthly",
    packageType: "MONTHLY",
    product: monthlyProduct,
  });

  const offering = {
    identifier: "web_mock",
    serverDescription: "Mock paywall web (DEV)",
    metadata: {},
    availablePackages: [annual, monthly],
    lifetime: null,
    annual,
    sixMonth: null,
    threeMonth: null,
    twoMonth: null,
    monthly,
    weekly: null,
  } as unknown as PurchasesOffering;

  return { offering, annual, monthly };
}

export async function mockPurchasePackage(): Promise<"purchased"> {
  await new Promise((resolve) => setTimeout(resolve, 450));
  return "purchased";
}
