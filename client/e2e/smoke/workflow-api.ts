import type { Page } from "@playwright/test";
import {
  buildTrackedExercise,
  e2eCatalogExercise,
  e2eTrackedId,
} from "../fixtures/exercises";
import { mockCoreAuthenticatedApi } from "./helpers";

type TrackedRow = ReturnType<typeof buildTrackedExercise>;
type PerfRow = {
  id: string;
  trackedExerciseId: string;
  date: string;
  weight: number;
  reps: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

function buildXpGrantResult() {
  return {
    totalXp: 10,
    level: 1,
    xpIntoLevel: 10,
    xpForNextLevel: 100,
    leveledUp: false,
    grants: [{ sourceType: "perf", amount: 10 }],
    streak: { current: 1, longest: 1 },
    league: null,
  };
}

function pickLatestPerf(entries: PerfRow[], trackedId: string): PerfRow | null {
  const scoped = entries.filter(
    (entry) => entry.trackedExerciseId === trackedId && !entry.deletedAt,
  );
  if (scoped.length === 0) return null;
  return scoped.reduce((best, entry) =>
    entry.updatedAt > best.updatedAt ? entry : best,
  );
}

function pickPersonalBest(entries: PerfRow[], trackedId: string): PerfRow | null {
  const scoped = entries.filter(
    (entry) => entry.trackedExerciseId === trackedId && !entry.deletedAt,
  );
  if (scoped.length === 0) return null;
  return scoped.reduce((best, entry) => {
    const bestScore = best.weight * (1 + best.reps / 30);
    const entryScore = entry.weight * (1 + entry.reps / 30);
    return entryScore > bestScore ? entry : best;
  });
}

function attachPerformance(tracked: TrackedRow, entries: PerfRow[]) {
  return {
    ...tracked,
    lastPerf: pickLatestPerf(entries, tracked.id),
    personalBest: pickPersonalBest(entries, tracked.id),
    league: null,
  };
}

export async function mockExerciseWorkflowApi(
  page: Page,
  options?: { seedTrackedExercise?: boolean; seedPerformance?: boolean },
): Promise<void> {
  const trackedExercises: TrackedRow[] = options?.seedTrackedExercise
    ? [buildTrackedExercise()]
    : [];
  const performanceEntries: PerfRow[] = [];

  if (options?.seedPerformance && options?.seedTrackedExercise) {
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    performanceEntries.push({
      id: "e2e-perf-1",
      trackedExerciseId: e2eTrackedId,
      date: today,
      weight: 60,
      reps: 8,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  await mockCoreAuthenticatedApi(page);

  await page.route("**/exercises/meta", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        targets: ["pectorals", "lats"],
        equipment: ["barbell", "body weight"],
      }),
    });
  });

  await page.route(/\/exercises(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [e2eCatalogExercise],
        total: 1,
      }),
    });
  });

  await page.route("**/league/browse-lookups", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        byZone: {},
        targetInZone: {},
        equipmentInPath: {},
      }),
    });
  });

  await page.route("**/league/summary", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(null),
    });
  });

  await page.route(/\/league\/exercises\/.*\/tiers/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ tiers: [] }),
    });
  });

  await page.route("**/tracked-exercises**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === "GET") {
      const withPerformance = url.includes("withPerformance=true");
      const includeDeleted = url.includes("includeDeleted=true");
      const rows = trackedExercises.filter(
        (row) => includeDeleted || !row.deletedAt,
      );
      const payload = withPerformance
        ? rows.map((row) => attachPerformance(row, performanceEntries))
        : rows;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
      return;
    }

    if (method === "POST") {
      let body: {
        id: string;
        exerciseId: string;
        name: string;
        originalName?: string;
        bodyPart?: string;
        target?: string;
        equipment?: string;
        gifUrl?: string;
        isCustom?: boolean;
      };
      try {
        body = route.request().postDataJSON() as typeof body;
      } catch {
        await route.fulfill({ status: 400, body: "invalid json" });
        return;
      }
      const now = new Date().toISOString();
      const row: TrackedRow = {
        id: body.id,
        exerciseId: body.exerciseId,
        name: body.name,
        originalName: body.originalName ?? body.name,
        bodyPart: body.bodyPart ?? "chest",
        target: body.target ?? "pectorals",
        equipment: body.equipment ?? "barbell",
        gifUrl: body.gifUrl ?? "",
        isCustom: body.isCustom ?? false,
        updatedAt: now,
        deletedAt: null,
      };
      const index = trackedExercises.findIndex((item) => item.id === row.id);
      if (index >= 0) trackedExercises[index] = row;
      else trackedExercises.push(row);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(row),
      });
      return;
    }

    await route.fallback();
  });

  await page.route("**/performance-entries**", async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    if (method === "GET") {
      const trackedId = new URL(url).searchParams.get("trackedExerciseId");
      const includeDeleted = url.includes("includeDeleted=true");
      const withLeagueInsights = url.includes("withLeagueInsights=true");
      const rows = performanceEntries.filter((entry) => {
        if (!includeDeleted && entry.deletedAt) return false;
        if (trackedId && entry.trackedExerciseId !== trackedId) return false;
        return true;
      });
      const payload = withLeagueInsights
        ? rows.map((entry) => ({
            ...entry,
            leagueInsight: {
              isRecord: false,
              leagueUp: false,
              prevLeague: null,
              nextLeague: null,
            },
          }))
        : rows;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
      return;
    }

    if (method === "POST") {
      const body = route.request().postDataJSON() as {
        id: string;
        trackedExerciseId: string;
        date: string;
        weight: number;
        reps: number;
      };
      const now = new Date().toISOString();
      const row: PerfRow = {
        id: body.id,
        trackedExerciseId: body.trackedExerciseId,
        date: body.date,
        weight: body.weight,
        reps: body.reps,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      performanceEntries.push(row);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...row,
          xp: buildXpGrantResult(),
        }),
      });
      return;
    }

    await route.fallback();
  });
}
