import { describe, expect, it } from "vitest";
import { formatSessionCommentTime } from "./session-comment-time";

describe("formatSessionCommentTime", () => {
  const now = Date.parse("2026-10-08T12:00:00.000Z");

  it("affiche les minutes récentes", () => {
    expect(
      formatSessionCommentTime("2026-10-08T11:48:00.000Z", now),
    ).toBe("il y a 12 min");
  });

  it("affiche les heures sous 24 h", () => {
    expect(
      formatSessionCommentTime("2026-10-08T09:00:00.000Z", now),
    ).toBe("il y a 3 h");
  });

  it("affiche le jour de la semaine au-delà", () => {
    const label = formatSessionCommentTime("2026-10-06T10:00:00.000Z", now);
    expect(label.length).toBeGreaterThan(0);
    expect(label.includes("--")).toBe(false);
    expect(label.includes("—")).toBe(false);
  });
});
