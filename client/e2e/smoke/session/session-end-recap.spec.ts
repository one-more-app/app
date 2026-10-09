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

const SESSION_ID = E2E_WORKOUT_SESSION_ID;

test("terminer la séance appelle l'API puis ouvre le récap hybride", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  await mockExerciseWorkflowApi(page, {
    seedTrackedExercise: true,
    seedPerformance: true,
  });

  const today = new Date().toISOString().slice(0, 10);
  const perfCreatedAt = new Date(Date.now() - 60 * 1000).toISOString();
  const tracked = buildTrackedExercise();
  let endedAt: string | null = null;
  let endCalls = 0;

  await page.route("**/sessions/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === "POST" && url.endsWith("/end")) {
      endCalls += 1;
      endedAt = new Date().toISOString();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: SESSION_ID, date: today, endedAt }),
      });
      return;
    }

    if (method === "GET" && url.includes("/day/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: SESSION_ID,
              date: today,
              startedAt: perfCreatedAt,
              endedAt,
              isLive: endedAt == null,
            },
          ],
        }),
      });
      return;
    }

    if (method === "GET" && !url.includes("/comments")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: SESSION_ID,
          owner: {
            userId: mockSession.user.id,
            firstName: null,
            lastName: null,
            username: null,
            avatarUrl: null,
          },
          date: today,
          isLive: endedAt == null,
          endedAt,
          xpEarned: 40,
          exercises: [
            {
              ...tracked,
              lastPerf: null,
              personalBest: null,
              league: null,
            },
          ],
          entries: [
            {
              id: "e2e-perf-1",
              trackedExerciseId: tracked.id,
              date: today,
              workoutSessionId: SESSION_ID,
              weight: 60,
              reps: 8,
              createdAt: perfCreatedAt,
              updatedAt: perfCreatedAt,
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
          reactionsByExerciseId: {},
        }),
      });
      return;
    }

    await route.fallback();
  });

  await page.goto("/#/home");

  const bar = page.getByRole("region", { name: UI.sessionBarA11y });
  await expect(bar).toBeVisible({ timeout: 10_000 });
  await bar.getByRole("button", { name: UI.sessionBarRestPassAria }).click();
  await bar.getByRole("button", { name: UI.sessionBarFinishAria }).click();

  const drawer = page.getByRole("dialog", { name: UI.endSessionTitle });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", { name: UI.endSessionConfirm }).click();

  await expect(page).toHaveURL(new RegExp(`/#/session/${SESSION_ID}$`));
  expect(endCalls).toBe(1);

  await expect(page.getByText(UI.recapTitle, { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText(UI.recapVolumeTitle)).toBeVisible();
  await expect(page.getByText("480", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("+40")).toBeVisible();
  await expect(
    page.getByRole("button", { name: UI.recapShareCta }),
  ).toBeVisible();

  expect(pageErrors).toEqual([]);
});
