import { expect, test } from "@playwright/test";
import { UI } from "../../src/lib/translations";
import {
  mockAuthApi,
  mockGymsApi,
  mockSession,
  seedE2eApiOrigin,
  trackPageErrors,
  AUTH_STORAGE_KEY,
} from "./helpers";

test("onboarding gym step skip on web", async ({ page }) => {
  const pageErrors = trackPageErrors(page);
  await seedE2eApiOrigin(page);
  await mockAuthApi(page);
  await mockGymsApi(page);

  await page.addInitScript(() => {
    localStorage.removeItem("one-more-onboarding-v1");
    localStorage.removeItem("one-more-gym-setup-done-v1");
  });

  await page.goto("/#/onboarding?step=gym");

  await page.evaluate(
    ({ authKey, session }) => {
      localStorage.setItem(authKey, JSON.stringify(session));
    },
    { authKey: AUTH_STORAGE_KEY, session: mockSession },
  );

  await page.reload();

  await expect(
    page.getByText(UI.gymOnboardingTitle, { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: UI.gymOnboardingSkip, exact: true }).click();

  await expect(page).toHaveURL(/#\/exercises\?tour=onboarding-first/);
  expect(pageErrors).toEqual([]);
});
