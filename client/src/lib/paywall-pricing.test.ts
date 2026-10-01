import { describe, expect, it } from "vitest";
import {
  annualPriceAfterGifts,
  describeAnnualDisplay,
  formatGiftAmount,
  monthlyPriceFromAnnual,
  readAnnualGiftsValue,
} from "./paywall-pricing";

describe("annual gift pricing", () => {
  it("reads the gift value from the offering, with 30 as default", () => {
    expect(readAnnualGiftsValue(null)).toBe(30);
    expect(readAnnualGiftsValue({ annualGiftsValue: 25 })).toBe(25);
    expect(readAnnualGiftsValue({ annualGiftsValue: "29,99" })).toBe(29.99);
  });

  it("subtracts 30€ so a 59,99€ plan displays 29,99€", () => {
    expect(annualPriceAfterGifts(59.99, 30)).toBe(29.99);
    expect(monthlyPriceFromAnnual(29.99)).toBe(2.5);
  });

  it("clamps to 0 when the current price is 29,99€ and gifts are 30€", () => {
    expect(annualPriceAfterGifts(29.99, 30)).toBe(0);
    expect(monthlyPriceFromAnnual(0)).toBe(0);
  });

  it("formats the annual card from the net price, not the store monthly price", () => {
    const display = describeAnnualDisplay(
      { price: 59.99, priceString: "59,99 €", currencyCode: "EUR" },
      30,
    );
    expect(display.price).toMatch(/29,99/);
    expect(display.perMonth).toMatch(/2,50/);
    expect(display.oldPrice).toBe("59,99 €");
    expect(formatGiftAmount(30, "EUR")).toBe("30€");
  });

  it("formats a 29,99€ plan after gifts as 0,00€ per year and per month", () => {
    const display = describeAnnualDisplay(
      { price: 29.99, priceString: "29,99 €", currencyCode: "EUR" },
      30,
    );
    expect(display.price).toMatch(/0,00/);
    expect(display.perMonth).toMatch(/0,00/);
    expect(display.oldPrice).toBe("29,99 €");
  });
});
