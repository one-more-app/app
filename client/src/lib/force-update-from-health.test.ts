import { describe, expect, it } from "vitest";
import { shouldForceUpdateFromHealth } from "./force-update-from-health";

describe("shouldForceUpdateFromHealth", () => {
  it("ignore web", () => {
    expect(
      shouldForceUpdateFromHealth({
        isNativePlatform: false,
        platform: "web",
        currentVersion: "1.0.0",
        body: { status: "ok", minVersion: { ios: "9.0.0" } },
      }),
    ).toBe(false);
  });

  it("bloque ios outdated", () => {
    expect(
      shouldForceUpdateFromHealth({
        isNativePlatform: true,
        platform: "ios",
        currentVersion: "1.3.9",
        body: { status: "ok", minVersion: { ios: "1.4.0", android: "9.0.0" } },
      }),
    ).toBe(true);
  });

  it("n'utilise pas la min de l'autre plateforme", () => {
    expect(
      shouldForceUpdateFromHealth({
        isNativePlatform: true,
        platform: "android",
        currentVersion: "1.0.0",
        body: { status: "ok", minVersion: { ios: "9.0.0" } },
      }),
    ).toBe(false);
  });

  it("fail-open sans minVersion", () => {
    expect(
      shouldForceUpdateFromHealth({
        isNativePlatform: true,
        platform: "ios",
        currentVersion: "1.0.0",
        body: { status: "ok" },
      }),
    ).toBe(false);
  });
});
