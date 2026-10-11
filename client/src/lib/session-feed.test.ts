import { describe, expect, it } from "vitest";
import {
  buildSessionFeedItems,
  collectDayKeysFromEntries,
} from "@/lib/session-feed";
import type { DaySessionSummary } from "@/lib/session-api";
import type { PerformanceEntry } from "@/types";

function entry(partial: Partial<PerformanceEntry> & Pick<PerformanceEntry, "id" | "date">): PerformanceEntry {
  return {
    trackedExerciseId: "ex-1",
    weight: 60,
    reps: 8,
    createdAt: `${partial.date}T10:00:00.000Z`,
    updatedAt: `${partial.date}T10:00:00.000Z`,
    ...partial,
  };
}

function session(
  partial: Pick<DaySessionSummary, "id" | "date" | "startedAt"> &
    Partial<DaySessionSummary>,
): DaySessionSummary {
  return {
    endedAt: null,
    isLive: false,
    ...partial,
  };
}

describe("collectDayKeysFromEntries", () => {
  it("returns distinct dates newest first", () => {
    const keys = collectDayKeysFromEntries([
      entry({ id: "a", date: "2026-10-01" }),
      entry({ id: "b", date: "2026-10-09" }),
      entry({ id: "c", date: "2026-10-09" }),
      entry({ id: "d", date: "2026-10-05", deletedAt: "2026-10-05T12:00:00.000Z" }),
    ]);
    expect(keys).toEqual(["2026-10-09", "2026-10-01"]);
  });
});

describe("buildSessionFeedItems", () => {
  it("flattens sessions newest first and splits same-day titles", () => {
    const items = buildSessionFeedItems([
      {
        dayKey: "2026-10-09",
        items: [
          session({
            id: "s-morning",
            date: "2026-10-09",
            startedAt: "2026-10-09T08:00:00.000Z",
          }),
          session({
            id: "s-evening",
            date: "2026-10-09",
            startedAt: "2026-10-09T18:00:00.000Z",
          }),
        ],
      },
      {
        dayKey: "2026-10-08",
        items: [
          session({
            id: "s-prev",
            date: "2026-10-08",
            startedAt: "2026-10-08T12:00:00.000Z",
          }),
        ],
      },
    ]);

    expect(items.map((item) => item.id)).toEqual([
      "s-evening",
      "s-morning",
      "s-prev",
    ]);
    // Newest of each day → day title; older same day → time only
    expect(items[0]!.title.length).toBeGreaterThan(0);
    expect(items[1]!.title).not.toEqual(items[0]!.title);
    expect(items[2]!.title.length).toBeGreaterThan(0);
  });

  it("skips empty days", () => {
    expect(
      buildSessionFeedItems([{ dayKey: "2026-10-09", items: [] }]),
    ).toEqual([]);
  });
});
