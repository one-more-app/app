import { describe, expect, it } from "vitest";
import {
  AF_EVENTS,
  buildCommerceEventValue,
  registrationEventName,
  resolveCommerceKind,
} from "./appsflyer-events";

describe("registrationEventName", () => {
  it("sends af_complete_registration only for a new user", () => {
    expect(registrationEventName(true)).toBe(AF_EVENTS.COMPLETE_REGISTRATION);
    expect(registrationEventName(false)).toBeNull();
  });
});

describe("resolveCommerceKind", () => {
  it("maps a free trial to af_start_trial", () => {
    expect(
      resolveCommerceKind({ isTrial: true, subscriptionPeriod: "monthly" }),
    ).toBe("trial");
  });

  it("maps a paid period to af_subscribe", () => {
    expect(resolveCommerceKind({ subscriptionPeriod: "yearly" })).toBe(
      "subscribe",
    );
  });

  it("maps lifetime / one-shot to af_purchase", () => {
    expect(resolveCommerceKind({ subscriptionPeriod: "lifetime" })).toBe(
      "purchase",
    );
  });

  it("skips renewals so TikTok is not double-counted", () => {
    expect(
      resolveCommerceKind({
        subscriptionPeriod: "monthly",
        isRenewal: true,
      }),
    ).toBeNull();
  });
});

describe("buildCommerceEventValue", () => {
  it("uses AppsFlyer revenue keys", () => {
    expect(
      buildCommerceEventValue({
        revenue: 49.99,
        currency: "EUR",
        productId: "premium_yearly",
      }),
    ).toEqual({
      af_revenue: 49.99,
      af_currency: "EUR",
      af_content_id: "premium_yearly",
    });
  });
});
