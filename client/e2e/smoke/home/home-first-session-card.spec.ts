import { expect, test } from "@playwright/test";
import { UI } from "../../../src/lib/translations";
import {
  mockAuthenticatedApi,
  seedAuthenticatedSession,
  seedOnboardingDone,
  trackPageErrors,
} from "../helpers";

test("accueil nouvel inscrit : carte première séance puis modification du rappel", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  await mockAuthenticatedApi(page);

  await page.goto("/#/home");

  const card = page.getByRole("region", { name: UI.homeFirstSessionTitle });
  await expect(card).toBeVisible({ timeout: 10_000 });
  await expect(card.getByText(UI.homeFirstSessionTagOn)).toBeVisible();
  await expect(page.getByText(UI.homeTodayEmptyTitle)).toHaveCount(0);

  await card
    .getByRole("button", { name: UI.homeFirstSessionEdit, exact: true })
    .click();
  await expect(page).toHaveURL(/#\/onboarding\?step=first-reminder&from=home/);
  await expect(page.getByText(UI.firstSessionReminderTitle)).toBeVisible();

  await page
    .getByRole("button", { name: UI.firstSessionReminderCta, exact: true })
    .click();
  await expect(page.getByText(UI.firstSessionNotedCardTitle)).toBeVisible({
    timeout: 10_000,
  });

  await page
    .getByRole("button", { name: UI.firstSessionNotedHome, exact: true })
    .click();
  await expect(page).toHaveURL(/#\/home/, { timeout: 10_000 });

  expect(pageErrors).toEqual([]);
});
