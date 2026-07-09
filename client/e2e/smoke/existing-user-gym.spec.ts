import { expect, test } from "@playwright/test";
import { UI } from "../../src/lib/translations";
import {
  mockAuthApi,
  mockSession,
  ONBOARDING_DONE_KEY,
  seedE2eApiOrigin,
  trackPageErrors,
  AUTH_STORAGE_KEY,
} from "./helpers";

test("existing user with gym in API goes to home without gym onboarding", async ({
  page,
}) => {
  await seedE2eApiOrigin(page);
  await mockAuthApi(page, { seedGym: { onboardingGymPending: false } });

  await page.addInitScript(
    ({ authKey, onboardingKey, session }) => {
      localStorage.setItem(onboardingKey, "done");
      localStorage.setItem("one-more-gym-notifications-prompt-done-v1", "1");
      localStorage.setItem("one-more-gym-location-prompt-done-v1", "1");
      localStorage.setItem(authKey, JSON.stringify(session));
    },
    {
      authKey: AUTH_STORAGE_KEY,
      onboardingKey: ONBOARDING_DONE_KEY,
      session: mockSession,
    },
  );

  await page.goto("/#/");
  await page.waitForResponse(
    (res) => res.url().includes("/gyms/me") && res.ok(),
  );
  await expect(page).toHaveURL(/#\/home$/);
});

test("onboarding account step skips gym when gym already saved in API", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await seedE2eApiOrigin(page);
  await mockAuthApi(page, { seedGym: { onboardingGymPending: false } });

  await page.addInitScript(
    ({ authKey, session }) => {
      localStorage.removeItem("one-more-onboarding-v1");
      localStorage.setItem("one-more-gym-notifications-prompt-done-v1", "1");
      localStorage.setItem("one-more-gym-location-prompt-done-v1", "1");
      localStorage.setItem(authKey, JSON.stringify(session));
    },
    { authKey: AUTH_STORAGE_KEY, session: mockSession },
  );

  await page.goto("/#/onboarding?step=account");

  await expect(
    page.getByText(UI.gymOnboardingTitle, { exact: true }),
  ).toHaveCount(0);
  await expect(page).toHaveURL(/#\/(home|exercises)$/);

  expect(pageErrors).toEqual([]);
});

test("existing user with gym pending in API is sent to gym-wait", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await seedE2eApiOrigin(page);
  await mockAuthApi(page, { seedGym: { onboardingGymPending: true } });

  await page.addInitScript(
    ({ authKey, onboardingKey, session }) => {
      localStorage.setItem(onboardingKey, "done");
      localStorage.setItem(authKey, JSON.stringify(session));
    },
    {
      authKey: AUTH_STORAGE_KEY,
      onboardingKey: ONBOARDING_DONE_KEY,
      session: mockSession,
    },
  );

  await page.goto("/#/home");
  await expect(page).toHaveURL(/#\/onboarding\?step=gym-wait$/, {
    timeout: 15_000,
  });
  await expect(
    page.getByText(UI.gymOnboardingWaitTitle, { exact: true }),
  ).toBeVisible();

  expect(pageErrors).toEqual([]);
});
