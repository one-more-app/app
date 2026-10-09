import { afterEach, describe, expect, it, vi } from "vitest";

describe("paywall web mock", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.doUnmock("@capacitor/core");
  });

  it("is enabled by default on web in DEV", async () => {
    vi.stubEnv("DEV", true);
    vi.doMock("@capacitor/core", () => ({
      Capacitor: {
        isNativePlatform: () => false,
        getPlatform: () => "web",
      },
    }));
    const { isPaywallWebMockEnabled, getMockCurrentOffering } = await import(
      "./paywall-web-mock"
    );
    expect(isPaywallWebMockEnabled()).toBe(true);
    const offering = getMockCurrentOffering();
    expect(offering.offering.identifier).toBe("web_mock");
    expect(offering.annual?.product.price).toBe(29.99);
    expect(offering.monthly?.product.price).toBe(2.99);
  });

  it("can be disabled with VITE_PAYWALL_WEB_MOCK=false", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITE_PAYWALL_WEB_MOCK", "false");
    vi.doMock("@capacitor/core", () => ({
      Capacitor: {
        isNativePlatform: () => false,
        getPlatform: () => "web",
      },
    }));
    const { isPaywallWebMockEnabled } = await import("./paywall-web-mock");
    expect(isPaywallWebMockEnabled()).toBe(false);
  });

  it("is disabled outside DEV", async () => {
    vi.stubEnv("DEV", false);
    vi.doMock("@capacitor/core", () => ({
      Capacitor: {
        isNativePlatform: () => false,
        getPlatform: () => "web",
      },
    }));
    const { isPaywallWebMockEnabled } = await import("./paywall-web-mock");
    expect(isPaywallWebMockEnabled()).toBe(false);
  });
});
