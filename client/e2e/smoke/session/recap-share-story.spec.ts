import { expect, test } from "@playwright/test";
import { buildTrackedExercise } from "../../fixtures/exercises";
import { UI } from "../../../src/lib/translations";
import {
  mockSession,
  seedAuthenticatedSession,
  seedOnboardingDone,
  trackPageErrors,
} from "../helpers";
import {
  E2E_WORKOUT_SESSION_ID,
  mockExerciseWorkflowApi,
} from "../workflow-api";

test("le récap hybride ouvre le tiroir de partage en story et enregistre un sticker", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  await mockExerciseWorkflowApi(page, { seedTrackedExercise: true });

  const today = new Date().toISOString().slice(0, 10);
  const createdAt = new Date(Date.now() - 3_600_000).toISOString();
  const tracked = buildTrackedExercise();
  const sessionId = E2E_WORKOUT_SESSION_ID;
  const league = {
    rankId: "gold_2",
    tier: "gold",
    subRank: 2,
    label: "Or II",
    tierLabel: "Or",
    oneRM: 90,
    progressToNext: 0.36,
  };

  await page.route("**/sessions/**", async (route) => {
    if (
      route.request().method() !== "GET" ||
      route.request().url().includes("/comments")
    ) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: sessionId,
        owner: {
          userId: mockSession.user.id,
          firstName: null,
          lastName: null,
          username: null,
          avatarUrl: null,
        },
        date: today,
        isLive: false,
        endedAt: new Date().toISOString(),
        xpEarned: 40,
        exercises: [
          { ...tracked, lastPerf: null, personalBest: null, league: null },
        ],
        entries: [
          {
            id: "e2e-perf-1",
            trackedExerciseId: tracked.id,
            date: today,
            workoutSessionId: sessionId,
            weight: 80,
            reps: 5,
            createdAt,
            updatedAt: createdAt,
            deletedAt: null,
            leagueInsight: {
              isRecord: true,
              leagueUp: false,
              prevLeague: null,
              nextLeague: league,
            },
          },
        ],
        highlights: [],
        commentCount: 0,
        exerciseCount: 1,
        setCount: 1,
        reactions: [],
        reactionsByExerciseId: {},
      }),
    });
  });

  await page.goto(`/#/session/${sessionId}`);
  await expect(page.getByText(UI.recapTitle, { exact: true })).toBeVisible({
    timeout: 10_000,
  });

  await expect(page.getByText("Bientôt disponible.")).toHaveCount(0);

  await page.getByRole("button", { name: UI.recapStoryThumbRecords }).click();
  const drawer = page.getByRole("dialog", { name: UI.recapStoryTitle });
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByRole("radio", { name: UI.recapStoryTabRecords }),
  ).toBeChecked();

  await drawer.getByRole("tab", { name: UI.recapStoryModeSticker }).click();

  const downloadPromise = page.waitForEvent("download");
  await drawer.getByRole("button", { name: UI.recapStorySave }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.png$/i);

  expect(pageErrors).toEqual([]);
});
