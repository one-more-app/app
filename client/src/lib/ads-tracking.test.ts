import { describe, expect, it } from "vitest";
import {
  isTrackingAuthorized,
  shouldPromptAtt,
  type AttAuthorizationStatus,
} from "./ads-tracking";

describe("shouldPromptAtt", () => {
  it("prompts only while iOS has not decided yet", () => {
    expect(shouldPromptAtt("notDetermined")).toBe(true);
    expect(shouldPromptAtt("authorized")).toBe(false);
    expect(shouldPromptAtt("denied")).toBe(false);
    expect(shouldPromptAtt("restricted")).toBe(false);
    expect(shouldPromptAtt("unavailable")).toBe(false);
  });
});

describe("isTrackingAuthorized", () => {
  it("is true only after the user accepts ATT", () => {
    const statuses: AttAuthorizationStatus[] = [
      "authorized",
      "denied",
      "restricted",
      "notDetermined",
      "unavailable",
    ];
    expect(statuses.filter(isTrackingAuthorized)).toEqual(["authorized"]);
  });
});
