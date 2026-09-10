import { expect, test } from "@playwright/test";
import {
  continueWithEmailFlow,
  mockAuthApi,
  NOTIFICATIONS_EDU_DONE_KEY,
  seedOnboardingDone,
  trackPageErrors,
} from "../helpers";
import { UI } from "../../../src/lib/translations";

const continueButton = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: UI.continue, exact: true });

test("après register : discovery puis notifications, Passer mène à la suite", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await page.addInitScript((key) => {
    localStorage.removeItem(key);
  }, NOTIFICATIONS_EDU_DONE_KEY);
  await mockAuthApi(page);

  const discoveryBodies: Array<{ source?: string }> = [];
  page.on("request", (request) => {
    if (request.method() !== "PUT") return;
    if (!request.url().includes("/profile/discovery-source")) return;
    discoveryBodies.push(
      request.postDataJSON() as (typeof discoveryBodies)[number],
    );
  });

  await page.goto("/#/auth");
  await continueWithEmailFlow(page, "discovery@one-more.test");

  await page.getByLabel("Prénom").fill("Disco");
  await continueButton(page).click();
  await page.getByLabel("Nom").fill("Very");
  await continueButton(page).click();
  await page.getByLabel("Pseudo").fill("smoke_user");
  await expect(page.getByText("Pseudo disponible")).toBeVisible({
    timeout: 5_000,
  });
  await continueButton(page).click();
  await page.getByLabel("Mot de passe", { exact: true }).fill("password123");
  await page.getByLabel("Confirmer le mot de passe").fill("password123");
  await page.getByRole("button", { name: "Créer mon compte", exact: true }).click();

  await expect(page.getByText(UI.onboardingDiscoveryTitle)).toBeVisible({
    timeout: 10_000,
  });
  await page
    .getByRole("button", { name: UI.onboardingSkip, exact: true })
    .click();

  await expect
    .poll(() => discoveryBodies.some((body) => body.source === "skipped"), {
      timeout: 5_000,
    })
    .toBe(true);

  await expect(page.getByText(UI.onboardingNotificationsTitle)).toBeVisible({
    timeout: 10_000,
  });
  await expect(
    page.getByRole("button", { name: UI.onboardingNotificationsCtaWeb }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: UI.onboardingSkip, exact: true })
    .click();

  await expect(page).toHaveURL(/#\/(home|exercises)/, { timeout: 10_000 });
  expect(pageErrors).toEqual([]);
});
