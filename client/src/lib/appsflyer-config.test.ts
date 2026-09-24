import { describe, expect, it } from "vitest";
import { normalizeAppsFlyerIosAppId } from "./appsflyer-config";

describe("normalizeAppsFlyerIosAppId", () => {
  it("strips the App Store id prefix", () => {
    expect(normalizeAppsFlyerIosAppId("id6774244720")).toBe("6774244720");
  });

  it("keeps a numeric App Store id", () => {
    expect(normalizeAppsFlyerIosAppId("6774244720")).toBe("6774244720");
  });
});
