import { expect, test } from "@playwright/test";
import { UI } from "../../../src/lib/translations";
import {
  mockAuthApi,
  seedAuthenticatedSession,
  seedOnboardingDone,
  trackPageErrors,
} from "../helpers";
import { mockExerciseWorkflowApi } from "../workflow-api";

test("bottom nav : 4 onglets et navigation", async ({ page }) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  await mockAuthApi(page);
  await mockExerciseWorkflowApi(page);

  await page.goto("/#/home");

  const nav = page.getByRole("navigation", { name: "Navigation" });
  await expect(nav.getByRole("link", { name: UI.navHome, exact: true })).toBeVisible();
  await expect(
    nav.getByRole("link", { name: UI.navExercises, exact: true }),
  ).toBeVisible();
  await expect(nav.getByRole("link", { name: UI.navSocial, exact: true })).toBeVisible();
  await expect(
    nav.getByRole("link", { name: UI.navSettings, exact: true }),
  ).toBeVisible();
  await expect(nav.getByRole("link")).toHaveCount(4);

  // Clics depuis l'accueil (évite les re-renders intensifs de /social qui détachent la nav).
  await nav.getByRole("link", { name: UI.navExercises, exact: true }).click();
  await expect(page).toHaveURL(/#\/exercises/);

  await page.goto("/#/home");
  await page
    .getByRole("navigation", { name: "Navigation" })
    .getByRole("link", { name: UI.navSocial, exact: true })
    .click();
  await expect(page).toHaveURL(/#\/social/);

  await page.goto("/#/home");
  await page
    .getByRole("navigation", { name: "Navigation" })
    .getByRole("link", { name: UI.navSettings, exact: true })
    .click();
  await expect(page).toHaveURL(/#\/settings/);

  await page
    .getByRole("navigation", { name: "Navigation" })
    .getByRole("link", { name: UI.navHome, exact: true })
    .click();
  await expect(page).toHaveURL(/#\/home/);

  expect(pageErrors).toEqual([]);
});
