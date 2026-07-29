import { expect, test } from "@playwright/test";
import {
  mockAuthenticatedApi,
  seedAuthenticatedSession,
  seedOnboardingDone,
  trackPageErrors,
} from "./helpers";
import { UI } from "../../src/lib/translations";

test("cloche notifications visible sur l'accueil", async ({ page }) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  await mockAuthenticatedApi(page);

  await page.goto("/#/home");

  await expect(
    page.getByRole("button", { name: UI.notificationsBellAria }),
  ).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: UI.notificationsBellAria }).click();
  await expect(
    page.getByRole("dialog", { name: UI.notificationsFeedTitle }),
  ).toBeVisible();
  await expect(page.getByText(UI.notificationsEmpty)).toBeVisible();

  expect(pageErrors).toEqual([]);
});
