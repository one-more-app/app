import { expect, test } from "@playwright/test";
import { isGymOnboardingBypassed } from "../../src/lib/gym-onboarding-route";
import { UI } from "../../src/lib/translations";
import {
  mockAuthApi,
  mockGymPlace,
  mockSession,
  seedE2eApiOrigin,
  trackPageErrors,
  AUTH_STORAGE_KEY,
  ONBOARDING_DONE_KEY,
} from "./helpers";

const gymOnboardingOff = isGymOnboardingBypassed();

test.describe("parcours salle", () => {
  test.skip(
    gymOnboardingOff,
    "parcours salle temporairement désactivé",
  );

  test("onboarding gym skip permissions unlocks app without wait", async ({
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

    await expect(
      page.getByRole("button", { name: UI.gymOnboardingSkipLater, exact: true }),
    ).toHaveCount(0);

    await page
      .getByRole("button", { name: UI.gymOnboardingNo, exact: true })
      .click();

    await expect(
      page.getByRole("button", { name: UI.gymOnboardingSkipNoGym, exact: true }),
    ).toBeVisible();

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
      .getByRole("button", {
        name: UI.gymOnboardingPermissionsSkip,
        exact: true,
      })
      .click();

    await expect(page).not.toHaveURL(/gym-wait/);
    await expect(page).toHaveURL(/#\/exercises$/);

    await page.goto("/#/home");
    await expect(page).not.toHaveURL(/gym-wait/);

    expect(pageErrors).toEqual([]);
  });

  test("onboarding gym skip without selecting a gym goes to exercises", async ({
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

    await page
      .getByRole("button", { name: UI.gymOnboardingNo, exact: true })
      .click();

    await page
      .getByRole("button", { name: UI.gymOnboardingSkipNoGym, exact: true })
      .click();

    await expect(page).toHaveURL(/#\/exercises$/, { timeout: 10_000 });
    await expect(page).not.toHaveURL(/gym/);

    expect(pageErrors).toEqual([]);
  });

  test("gym-wait unlocks to exercises without permissions reminders", async ({
    page,
  }) => {
    const pageErrors = trackPageErrors(page);
    await seedE2eApiOrigin(page);
    await mockAuthApi(page, { seedGym: { onboardingGymPending: true } });

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

    await page.goto("/#/home");
    await expect(page).toHaveURL(/#\/onboarding\?step=gym-wait$/, {
      timeout: 15_000,
    });

    await expect(
      page.getByText(UI.gymOnboardingWaitTitle, { exact: true }),
    ).toBeVisible();

    await expect(
      page.getByText(mockGymPlace.name, { exact: true }),
    ).toBeVisible();

    await expect(
      page.getByText(UI.gymOnboardingWaitMonitoringTitle, { exact: true }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: UI.gymOnboardingWaitCta, exact: true })
      .click();

    await expect(page).toHaveURL(/#\/exercises$/);
    expect(pageErrors).toEqual([]);
  });

  test("onboarding gym skips wait when user claims to be at gym", async ({
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

    await page
      .getByRole("button", { name: UI.gymOnboardingYes, exact: true })
      .click();

    await expect(
      page.getByText(UI.gymOnboardingSearch, { exact: true }),
    ).toBeVisible();

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

    await page
      .getByRole("button", {
        name: UI.gymOnboardingPermissionsSkip,
        exact: true,
      })
      .click();

    await expect(page).not.toHaveURL(/gym-wait/);
    await expect(page).toHaveURL(/#\/exercises$/);

    await page.goto("/#/home");
    await expect(page).not.toHaveURL(/gym-wait/);

    expect(pageErrors).toEqual([]);
  });
});

test.describe("parcours salle désactivé", () => {
  test.skip(!gymOnboardingOff, "parcours salle actif");

  test("onboarding gym step is skipped without wait", async ({ page }) => {
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
    ).toHaveCount(0);
    await expect(page).not.toHaveURL(/gym-wait/);
    await expect(page).toHaveURL(/#\/(home|exercises|onboarding\?step=body)/);

    expect(pageErrors).toEqual([]);
  });

  test("gym pending in API does not send to gym-wait", async ({ page }) => {
    const pageErrors = trackPageErrors(page);
    await seedE2eApiOrigin(page);
    await mockAuthApi(page, { seedGym: { onboardingGymPending: true } });

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

    await page.goto("/#/home");
    await expect(page).toHaveURL(/#\/home$/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/gym-wait/);
    await expect(
      page.getByText(UI.gymOnboardingWaitTitle, { exact: true }),
    ).toHaveCount(0);

    expect(pageErrors).toEqual([]);
  });
});
