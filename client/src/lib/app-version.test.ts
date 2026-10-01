import { describe, expect, it } from "vitest";
import { isBelowMinVersion, parseMarketingVersion } from "./app-version";

describe("parseMarketingVersion", () => {
  it("parse 1.2.3 et v1.2.3", () => {
    expect(parseMarketingVersion("1.2.3")).toEqual([1, 2, 3]);
    expect(parseMarketingVersion("v1.2.3")).toEqual([1, 2, 3]);
  });

  it("rejette invalide", () => {
    expect(parseMarketingVersion("")).toBeNull();
    expect(parseMarketingVersion("–")).toBeNull();
    expect(parseMarketingVersion("1.2")).toBeNull();
    expect(parseMarketingVersion("abc")).toBeNull();
  });
});

describe("isBelowMinVersion", () => {
  it("détecte outdated / égalité / plus récent", () => {
    expect(isBelowMinVersion("1.3.9", "1.4.0")).toBe(true);
    expect(isBelowMinVersion("1.4.0", "1.4.0")).toBe(false);
    expect(isBelowMinVersion("1.4.1", "1.4.0")).toBe(false);
    expect(isBelowMinVersion("v1.3.9", "1.4.0")).toBe(true);
  });

  it("fail-open si parse impossible", () => {
    expect(isBelowMinVersion("", "1.4.0")).toBe(false);
    expect(isBelowMinVersion("1.4.0", "")).toBe(false);
    expect(isBelowMinVersion("–", "1.4.0")).toBe(false);
  });
});
