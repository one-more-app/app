import { describe, expect, it } from "vitest";
import { getFreeTrialLabel } from "./paywall-free-trial";

type PurchasesStoreProduct =
  import("@revenuecat/purchases-capacitor").PurchasesStoreProduct;

function product(
  partial: Partial<PurchasesStoreProduct>,
): PurchasesStoreProduct {
  return partial as PurchasesStoreProduct;
}

describe("getFreeTrialLabel", () => {
  it("returns null without intro or free phase", () => {
    expect(
      getFreeTrialLabel(
        product({ introPrice: null, defaultOption: null }),
      ),
    ).toBeNull();
  });

  it("formats iOS free introPrice in days", () => {
    expect(
      getFreeTrialLabel(
        product({
          introPrice: {
            price: 0,
            priceString: "0,00 €",
            cycles: 1,
            period: "P7D",
            periodUnit: "DAY",
            periodNumberOfUnits: 7,
          },
          defaultOption: null,
        }),
      ),
    ).toBe("7 jours offerts");
  });

  it("ignores paid introPrice", () => {
    expect(
      getFreeTrialLabel(
        product({
          introPrice: {
            price: 0.99,
            priceString: "0,99 €",
            cycles: 1,
            period: "P1M",
            periodUnit: "MONTH",
            periodNumberOfUnits: 1,
          },
          defaultOption: null,
        }),
      ),
    ).toBeNull();
  });

  it("formats Android freePhase", () => {
    expect(
      getFreeTrialLabel(
        product({
          introPrice: null,
          defaultOption: {
            freePhase: {
              billingPeriod: {
                unit: "DAY",
                value: 7,
                iso8601: "P7D",
              },
              billingCycleCount: 1,
              recurrenceMode: null,
              price: {
                formatted: "0,00 €",
                amountMicros: 0,
                currencyCode: "EUR",
              },
              offerPaymentMode: null,
            },
          } as PurchasesStoreProduct["defaultOption"],
        }),
      ),
    ).toBe("7 jours offerts");
  });

  it("formats singular day", () => {
    expect(
      getFreeTrialLabel(
        product({
          introPrice: {
            price: 0,
            priceString: "0,00 €",
            cycles: 1,
            period: "P1D",
            periodUnit: "DAY",
            periodNumberOfUnits: 1,
          },
          defaultOption: null,
        }),
      ),
    ).toBe("1 jour offert");
  });
});
