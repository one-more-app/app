import { describe, expect, it } from "vitest";
import {
  formatRestElapsed,
  formatRestElapsedA11y,
  getRestElapsedMs,
  getRestProgress01,
  isRestSinceLastSetVisible,
  REST_SINCE_LAST_SET_MAX_MS,
} from "./format-rest-elapsed";

describe("formatRestElapsed", () => {
  it("formats gym m:ss", () => {
    expect(formatRestElapsed(0)).toBe("0:00");
    expect(formatRestElapsed(45_000)).toBe("0:45");
    expect(formatRestElapsed(125_000)).toBe("2:05");
    expect(formatRestElapsed(599_000)).toBe("9:59");
  });

  it("clamps negative values to 0:00", () => {
    expect(formatRestElapsed(-1000)).toBe("0:00");
  });
});

describe("formatRestElapsedA11y", () => {
  it("formats French accessible labels", () => {
    expect(formatRestElapsedA11y(1000)).toBe("1 seconde");
    expect(formatRestElapsedA11y(45_000)).toBe("45 secondes");
    expect(formatRestElapsedA11y(60_000)).toBe("1 minute");
    expect(formatRestElapsedA11y(125_000)).toBe("2 minutes 5 secondes");
  });
});

describe("isRestSinceLastSetVisible", () => {
  const now = Date.parse("2026-06-08T12:00:00.000Z");

  it("is visible within 10 minutes", () => {
    const createdAt = new Date(now - 5 * 60_000).toISOString();
    expect(isRestSinceLastSetVisible(createdAt, now)).toBe(true);
  });

  it("is hidden after 10 minutes", () => {
    const createdAt = new Date(
      now - REST_SINCE_LAST_SET_MAX_MS,
    ).toISOString();
    expect(isRestSinceLastSetVisible(createdAt, now)).toBe(false);
  });

  it("is hidden without timestamp", () => {
    expect(isRestSinceLastSetVisible(null, now)).toBe(false);
  });
});

describe("getRestProgress01", () => {
  it("returns ratio capped at 1", () => {
    expect(getRestProgress01(0)).toBe(0);
    expect(getRestProgress01(REST_SINCE_LAST_SET_MAX_MS / 2)).toBe(0.5);
    expect(getRestProgress01(REST_SINCE_LAST_SET_MAX_MS)).toBe(1);
    expect(getRestProgress01(REST_SINCE_LAST_SET_MAX_MS * 2)).toBe(1);
  });
});

describe("getRestElapsedMs", () => {
  it("returns null for invalid input", () => {
    expect(getRestElapsedMs(null)).toBeNull();
    expect(getRestElapsedMs("invalid")).toBeNull();
  });
});
