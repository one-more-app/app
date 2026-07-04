import { expect, test } from "@playwright/test";
import {
  AUTH_STORAGE_KEY,
  mockAuthenticatedApi,
  seedAuthenticatedSession,
  trackPageErrors,
} from "./helpers";

test("la déconnexion efface la session locale", async ({ page }) => {
  const pageErrors = trackPageErrors(page);
  await seedAuthenticatedSession(page);
  await mockAuthenticatedApi(page);

  await page.goto("/#/settings");

  await expect(page.getByText("Connecté en tant que")).toBeVisible();
  await page.getByRole("button", { name: "Se déconnecter" }).click();

  await expect(page).toHaveURL(/#\/auth/, { timeout: 10_000 });
  await expect(
    page.getByText("Connectez-vous ou créez un compte"),
  ).toBeVisible();

  const storedSession = await page.evaluate((key) => localStorage.getItem(key), AUTH_STORAGE_KEY);
  expect(storedSession).toBeNull();
  expect(pageErrors).toEqual([]);
});
