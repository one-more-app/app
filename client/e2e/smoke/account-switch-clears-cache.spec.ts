import { expect, test } from "@playwright/test";
import { e2eCatalogExercise, e2eTrackedId } from "../fixtures/exercises";
import {
  AUTH_STORAGE_KEY,
  seedAuthenticatedSession,
  seedOnboardingDone,
  trackPageErrors,
} from "./helpers";
import { mockExerciseWorkflowApi } from "./workflow-api";

const userBSession = {
  accessToken: "smoke-access-token-b",
  refreshToken: "smoke-refresh-token-b",
  user: {
    id: "smoke-user-2",
    email: "user-b@one-more.test",
  },
};

const continueButton = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: "Continuer", exact: true });

test("changement de compte sans fuite d'exercices", async ({ page }) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  await mockExerciseWorkflowApi(page, { seedTrackedExercise: true });

  await page.goto(`/#/exercise/${e2eTrackedId}`);
  await expect(
    page.locator("h1").filter({ hasText: e2eCatalogExercise.name }),
  ).toBeVisible({ timeout: 10_000 });

  await page.goto("/#/settings");
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/#\/auth/, { timeout: 10_000 });

  await page.route("**/auth/identify", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ exists: true }),
    });
  });

  await page.route("**/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(userBSession),
    });
  });

  await page.route("**/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(userBSession),
    });
  });

  await page.route("**/tracked-exercises**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/performance-entries**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.getByLabel("Email").fill(userBSession.user.email);
  await continueButton(page).click();
  await page.getByLabel("Mot de passe", { exact: true }).fill("password123");

  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/auth/login") &&
      response.request().method() === "POST" &&
      response.ok(),
  );
  await page.getByRole("button", { name: "Se connecter" }).click();
  await loginResponse;

  await expect.poll(async () => {
    const stored = await page.evaluate(
      (key) => localStorage.getItem(key),
      AUTH_STORAGE_KEY,
    );
    return stored?.includes(userBSession.user.id) ?? false;
  }).toBe(true);

  await page.goto(`/#/exercise/${e2eTrackedId}`);
  await expect(
    page.locator("h1").filter({ hasText: e2eCatalogExercise.name }),
  ).not.toBeVisible({ timeout: 15_000 });

  const storedSession = await page.evaluate((key) => localStorage.getItem(key), AUTH_STORAGE_KEY);
  expect(storedSession).toContain(userBSession.user.id);
  expect(pageErrors).toEqual([]);
});
