import { expect, test } from "@playwright/test";
import { buildTrackedExercise } from "../fixtures/exercises";
import { UI } from "../../src/lib/translations";
import {
  mockSession,
  seedAuthenticatedSession,
  seedOnboardingDone,
  trackPageErrors,
} from "./helpers";
import { mockExerciseWorkflowApi } from "./workflow-api";

test("historique vers page séance", async ({ page }) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  await mockExerciseWorkflowApi(page, {
    seedTrackedExercise: true,
    seedPerformance: true,
  });

  const today = new Date().toISOString().slice(0, 10);
  const finishedPerfCreatedAt = new Date(
    Date.now() - 2 * 60 * 60 * 1000,
  ).toISOString();
  const tracked = buildTrackedExercise();

  await page.route("**/sessions/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes("/comments")) {
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: [] }),
        });
        return;
      }
      await route.fallback();
      return;
    }

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          owner: {
            userId: mockSession.user.id,
            firstName: null,
            lastName: null,
            username: null,
            avatarUrl: null,
          },
          date: today,
          isLive: false,
          exercises: [
            {
              ...tracked,
              lastPerf: {
                id: "e2e-perf-1",
                trackedExerciseId: tracked.id,
                date: today,
                weight: 60,
                reps: 8,
                createdAt: finishedPerfCreatedAt,
                updatedAt: finishedPerfCreatedAt,
                deletedAt: null,
              },
              personalBest: null,
              league: null,
            },
          ],
          entries: [
            {
              id: "e2e-perf-1",
              trackedExerciseId: tracked.id,
              date: today,
              weight: 60,
              reps: 8,
              createdAt: finishedPerfCreatedAt,
              updatedAt: finishedPerfCreatedAt,
              deletedAt: null,
              leagueInsight: {
                isRecord: false,
                leagueUp: false,
                prevLeague: null,
                nextLeague: null,
              },
            },
          ],
          highlights: [],
          commentCount: 0,
          exerciseCount: 1,
          setCount: 1,
          reactions: [],
          reactionsByExerciseId: {
            [tracked.id]: [{ emoji: "💪", count: 1, reactedByMe: false }],
          },
        }),
      });
      return;
    }

    if (method === "POST" && url.includes("/reactions")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          added: true,
          target: {
            targetType: "exercise",
            trackedExerciseId: tracked.id,
            reactions: [{ emoji: "💪", count: 2, reactedByMe: true }],
          },
        }),
      });
      return;
    }

    await route.fallback();
  });

  await page.goto("/#/history");

  const perfResponse = await page.waitForResponse(
    (response) =>
      response.url().includes("/performance-entries") &&
      response.request().method() === "GET",
  );
  const perfBody = (await perfResponse.json()) as Array<{ date: string }>;
  expect(perfBody.length).toBeGreaterThan(0);
  const dayKey = perfBody[0]!.date;

  await page.goto(`/#/session/${mockSession.user.id}/${dayKey}`);

  await page.waitForResponse(
    (response) =>
      response.url().includes("/sessions/") &&
      response.request().method() === "GET" &&
      !response.url().includes("/comments") &&
      !response.url().includes("/reactions"),
  );

  await expect(page.getByText(UI.sessionTitleMine)).toBeVisible({
    timeout: 10_000,
  });
  await expect(
    page.getByRole("heading", { name: UI.sessionCommentsTitle }),
  ).toBeVisible({
    timeout: 10_000,
  });
  await expect(
    page.getByText(
      `${UI.sessionSummary.replace("{exercises}", "1").replace("{records}", "0")} · ${UI.sessionDurationMinutes.replace("{count}", "1")}`,
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: UI.sessionReactionToggleAdd.replace("{emoji}", "💪"),
    }),
  ).toBeVisible();

  expect(pageErrors).toEqual([]);
});
