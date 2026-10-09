import { describe, expect, it } from "vitest";
import {
  annualSavingsPercent,
  describeAnnualDisplay,
  monthlyPriceFromAnnual,
} from "./paywall-pricing";

describe("annual pricing", () => {
  it("formats the annual card from the store price", () => {
    const display = describeAnnualDisplay({
      price: 59.99,
      priceString: "59,99 €",
      currencyCode: "EUR",
    });
    expect(display.price).toMatch(/59,99/);
    expect(display.perMonth).toMatch(/5,00/);
    expect(monthlyPriceFromAnnual(59.99)).toBe(5);
  });

  it("falls back to priceString when price is missing", () => {
    const display = describeAnnualDisplay({
      price: Number.NaN,
      priceString: "59,99 €",
      currencyCode: "EUR",
    });
    expect(display.price).toBe("59,99 €");
    expect(display.perMonth).toBe("59,99 €");
  });

  it("computes savings percent vs 12 monthly payments", () => {
    expect(annualSavingsPercent(59.99, 9.99)).toBe(50);
    expect(annualSavingsPercent(59.99, 4)).toBeNull();
    expect(annualSavingsPercent(0, 9.99)).toBeNull();
  });
});
