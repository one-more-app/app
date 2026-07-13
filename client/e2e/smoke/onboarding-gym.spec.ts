import { expect, test } from "@playwright/test";
import { UI } from "../../src/lib/translations";
import {
  mockAuthApi,
  mockGymPlace,
  mockSession,
  seedE2eApiOrigin,
  trackPageErrors,
  AUTH_STORAGE_KEY,
} from "./helpers";

test("onboarding gym step blocks until gym saved and wait unlock", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await seedE2eApiOrigin(page);
  await mockAuthApi(page);

  await page.addInitScript(() => {
    localStorage.removeItem("one-more-onboarding-v1");
    localStorage.removeItem("one-more-gym-setup-done-v1");
    localStorage.removeItem("one-more-onboarding-gym-pending-v1");
    localStorage.removeItem("one-more-gym-onboarding-in-zone-v1");
    localStorage.removeItem("one-more-gym-onboarding-name-v1");
    localStorage.removeItem("one-more-gym-notifications-prompt-done-v1");
    localStorage.removeItem("one-more-gym-location-prompt-done-v1");
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

  await expect(page.getByText("Plus tard", { exact: true })).toHaveCount(0);

  await page
    .getByRole("button", { name: UI.gymOnboardingNo, exact: true })
    .click();

  await page.waitForResponse(
    (response) =>
      response.url().includes("/gyms/search") && response.ok(),
  );

  await page
    .getByRole("radio", { name: UI.gymOnboardingViewList, exact: true })
    .click();

  await page
    .getByPlaceholder(UI.gymOnboardingSearchPlaceholder, { exact: true })
    .fill("Basic");

  await page.waitForResponse(
    (response) =>
      response.url().includes("/gyms/search") &&
      response.ok() &&
      response.request().method() === "GET",
  );

  const gymResult = page.getByRole("button", {
    name: mockGymPlace.name,
    exact: true,
  });
  await expect(gymResult).toBeVisible({ timeout: 10_000 });
  await gymResult.click();

  await expect(
    page.getByText(UI.gymOnboardingPermissionsTitle, { exact: true }),
  ).toBeVisible();

  // Web preview : pas de push ni géoloc native → on passe l'étape permissions.
  await page
    .getByRole("button", { name: UI.gymOnboardingPermissionsSkip, exact: true })
    .click();

  await expect(page).toHaveURL(/#\/onboarding\?step=gym-wait$/);

  await expect(
    page.getByText(UI.gymOnboardingWaitTitle, { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText(mockGymPlace.name, { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText(UI.gymOnboardingWaitRemindersSection, { exact: true }),
  ).toBeVisible();

  await page.goto("/#/home");
  await expect(page).toHaveURL(/#\/onboarding\?step=gym-wait$/);

  await page
    .getByRole("button", { name: UI.gymOnboardingWaitCta, exact: true })
    .click();

  await expect(page).toHaveURL(/#\/exercises$/);
  expect(pageErrors).toEqual([]);
});
