import { expect, test } from "@playwright/test";
import { UI } from "../../../src/lib/translations";
import {
  mockAuthenticatedApi,
  seedAuthenticatedSession,
  seedOnboardingDone,
  trackPageErrors,
} from "../helpers";

test("accueil : semaine, état vide du jour et CTA démarrer une séance", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  await mockAuthenticatedApi(page);

  await page.goto("/#/home");

  await expect(
    page.getByRole("tablist", { name: UI.homeWeekNavLabel }),
  ).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(UI.homeWeekToday, { exact: true })).toBeVisible();
  await expect(page.getByText(UI.homeTodayEmptyTitle)).toBeVisible();

  const cta = page.getByRole("button", { name: UI.homeStartSession });
  await expect(cta).toBeVisible();
  await cta.click();
  await expect(page).toHaveURL(/#\/exercises/);

  expect(pageErrors).toEqual([]);
});
