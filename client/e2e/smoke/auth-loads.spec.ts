import { expect, test } from "@playwright/test";
import { seedOnboardingDone, trackPageErrors } from "./helpers";

test("la page auth se charge sans erreur JS", async ({ page }) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);

  await page.goto("/#/auth");

  await expect(page.getByText("Content de te revoir.")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Mot de passe")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Rejoindre", exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
