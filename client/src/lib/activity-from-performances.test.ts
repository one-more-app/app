import { describe, expect, it } from "vitest";
import {
  mergePerformanceEntriesById,
  preservePerformanceLogCreatedAt,
} from "@/lib/activity-from-performances";
import type { PerformanceEntry } from "@/types";

function entry(
  overrides: Partial<PerformanceEntry> & Pick<PerformanceEntry, "id">,
): PerformanceEntry {
  return {
    trackedExerciseId: "exo-1",
    date: "2026-07-03",
    weight: 100,
    reps: 5,
    createdAt: "2026-07-03T10:00:00.000Z",
    updatedAt: "2026-07-03T10:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("preservePerformanceLogCreatedAt", () => {
  it("keeps the earlier createdAt when the API returns updatedAt as createdAt", () => {
    const existing = entry({
      id: "p1",
      createdAt: "2026-07-03T10:00:00.000Z",
    });
    const incoming = entry({
      id: "p1",
      weight: 110,
      createdAt: "2026-07-03T10:05:00.000Z",
      updatedAt: "2026-07-03T10:05:00.000Z",
    });

    expect(preservePerformanceLogCreatedAt(incoming, existing).createdAt).toBe(
      existing.createdAt,
    );
    expect(preservePerformanceLogCreatedAt(incoming, existing).weight).toBe(110);
  });
});

describe("mergePerformanceEntriesById", () => {
  it("preserves local createdAt when merging remote edits", () => {
    const local = [
      entry({
        id: "p1",
        createdAt: "2026-07-03T10:00:00.000Z",
      }),
    ];
    const remote = [
      entry({
        id: "p1",
        weight: 120,
        createdAt: "2026-07-03T10:05:00.000Z",
        updatedAt: "2026-07-03T10:05:00.000Z",
      }),
    ];

    const merged = mergePerformanceEntriesById(remote, local);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.createdAt).toBe("2026-07-03T10:00:00.000Z");
    expect(merged[0]?.weight).toBe(120);
  });
});
