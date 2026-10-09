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

test("page séance by id (détail + commentaires)", async ({ page }) => {
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
  const sessionId = E2E_WORKOUT_SESSION_ID;

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

    if (method === "GET" && url.includes("/day/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: sessionId,
              date: today,
              startedAt: finishedPerfCreatedAt,
              endedAt: finishedPerfCreatedAt,
              isLive: false,
            },
          ],
        }),
      });
      return;
    }

    if (method === "GET") {
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
          endedAt: finishedPerfCreatedAt,
          xpEarned: 0,
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
              workoutSessionId: sessionId,
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
          reactions: [
            {
              emoji: "💪",
              count: 1,
              reactedByMe: false,
              users: [
                {
                  userId: "friend-1",
                  firstName: "Alex",
                  lastName: null,
                  username: "alex",
                  avatarUrl: null,
                },
              ],
            },
          ],
          reactionsByExerciseId: {},
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
            targetType: "session",
            trackedExerciseId: null,
            reactions: [
              {
                emoji: "💪",
                count: 2,
                reactedByMe: true,
                users: [
                  {
                    userId: "friend-1",
                    firstName: "Alex",
                    lastName: null,
                    username: "alex",
                    avatarUrl: null,
                  },
                  {
                    userId: mockSession.user.id,
                    firstName: "Vince",
                    lastName: null,
                    username: "vince",
                    avatarUrl: null,
                  },
                ],
              },
            ],
          },
        }),
      });
      return;
    }

    await route.fallback();
  });

  await page.goto(`/#/session/${sessionId}`);

  // Séance terminée owner → titre récap hybride
  await expect(page.getByText(UI.recapTitle, { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  await expect(
    page.getByRole("heading", { name: UI.sessionCommentsTitle }),
  ).toBeVisible({
    timeout: 10_000,
  });
  await expect(
    page.getByRole("button", {
      name: UI.sessionReactionToggleAdd.replace("{emoji}", "💪"),
    }),
  ).toBeVisible();

  expect(pageErrors).toEqual([]);
});
