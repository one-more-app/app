import { expect, test } from "@playwright/test";
import { UI } from "../../../src/lib/translations";
import {
  seedAuthenticatedSession,
  seedOnboardingDone,
  trackPageErrors,
} from "../helpers";
import { mockExerciseWorkflowApi } from "../workflow-api";

function localDateKey(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

test("onglet Social : classement, amis, entraînement en cours et dernières séances", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  await mockExerciseWorkflowApi(page, { seedTrackedExercise: true });

  const friend = (userId: string, firstName: string, lastActiveDate: string | null) => ({
    friendshipId: `f-${userId}`,
    userId,
    firstName,
    lastName: null,
    username: null,
    avatarUrl: null,
    isPremium: false,
    status: "accepted",
    direction: "friend",
    lastActiveDate,
  });

  await page.route("**/social/friends**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        friends: [
          friend("u-ambre", "Ambre", localDateKey()),
          friend("u-tony", "Tony", localDateKey(-1)),
        ],
        pendingIncoming: [],
        pendingOutgoing: [],
      }),
    });
  });

  await page.route("**/presence/friends**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            userId: "u-ambre",
            status: "training",
            exerciseName: "Squat",
            trackedExerciseId: null,
            lastHeartbeatAt: new Date().toISOString(),
          },
        ],
      }),
    });
  });

  await page.route("**/ranking/gym**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        month: "2026-10",
        entries: [],
        total: 40,
        me: { userId: "e2e-user", xp: 1240, rank: 12, globalRank: null },
        meta: {
          hasGym: true,
          rankingOptIn: true,
          placeName: "Basic-Fit Lyon 7",
        },
      }),
    });
  });

  await page.goto("/#/social");

  await expect(page.getByText("Basic-Fit Lyon 7", { exact: false })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText("#12", { exact: true })).toBeVisible();
  await expect(page.getByText("1 240 XP".replace(" ", "\u202f"))).toBeVisible();

  await expect(page.getByText("2 amis · 1 en séance")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: UI.socialTrainingNowTitle }),
  ).toBeVisible();
  await expect(page.getByText(`${UI.socialSessionLive} · Squat`)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: UI.socialRecentSessionsTitle }),
  ).toBeVisible();
  await expect(page.getByText(UI.socialSessionYesterday)).toBeVisible();

  // L'onglet Social est actif dans la barre de navigation, Classement n'y est plus.
  const nav = page.getByRole("navigation", { name: "Navigation" });
  await expect(nav.getByRole("link", { name: UI.navSocial })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.getByRole("link", { name: UI.rankingTitle })).toHaveCount(0);

  // La carte classement mène à /ranking.
  await page.getByRole("link", { name: UI.socialRankingCardAria }).click();
  await expect(page).toHaveURL(/#\/ranking/);

  expect(pageErrors).toEqual([]);
});
