import { expect, test } from "@playwright/test";
import {
  continueWithEmailFlow,
  dismissPostAuthDiscoveryAndNotifications,
  mockAuthApi,
  seedOnboardingDone,
  trackPageErrors,
} from "../helpers";

const continueButton = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: "Continuer", exact: true });

test("l'inscription complète ne plante pas au clic Créer un compte", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await mockAuthApi(page);

  await page.goto("/#/auth");

  await continueWithEmailFlow(page, "nouveau@one-more.test");

  await page.getByLabel("Prénom").fill("Smoke");
  await continueButton(page).click();

  await page.getByLabel("Nom").fill("Test");
  await continueButton(page).click();

  await page.getByLabel("Pseudo").fill("smoke_user");
  await expect(page.getByText("Pseudo disponible")).toBeVisible({
    timeout: 5_000,
  });
  await continueButton(page).click();

  await page.getByLabel("Mot de passe", { exact: true }).fill("password123");
  await page.getByLabel("Confirmer le mot de passe").fill("password123");
  await page.getByRole("button", { name: "Créer mon compte", exact: true }).click();

  await dismissPostAuthDiscoveryAndNotifications(page);

  await expect(page).toHaveURL(/#\/(home|exercises)/, { timeout: 10_000 });
  expect(pageErrors).toEqual([]);
});
