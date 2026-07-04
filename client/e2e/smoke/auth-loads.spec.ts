import { expect, test } from "@playwright/test";
import { seedOnboardingDone, trackPageErrors } from "./helpers";

test("la page auth se charge sans erreur JS", async ({ page }) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);

  await page.goto("/#/auth");

  await expect(
    page.getByText("Connectez-vous ou créez un compte"),
  ).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  expect(pageErrors).toEqual([]);
});
