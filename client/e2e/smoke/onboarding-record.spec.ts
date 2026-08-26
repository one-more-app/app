import { expect, test, type Page } from "@playwright/test";
import { mockAuthApi, trackPageErrors } from "./helpers";

const continueButton = (page: Page) =>
  page.getByRole("button", { name: "Continuer", exact: true });

async function submitStarterRecord(page: Page): Promise<void> {
  await expect(page.getByText("Commence par un record")).toBeVisible();
  await page.getByRole("button", { name: /Développé couché/ }).click();

  const drawer = page.getByRole("dialog", { name: "Nouvelle performance" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", { name: "Enregistrer" }).click();
}

test("l'onboarding record montre le 1RM, le palier puis le compte", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await mockAuthApi(page);

  await page.goto("/#/onboarding");

  await expect(page.getByText("1/4")).toBeVisible();
  await submitStarterRecord(page);

  await expect(page.getByText("2/4")).toBeVisible();
  await expect(page.getByText("Ton 1RM", { exact: true })).toBeVisible();
  await expect(page.getByText("70.0", { exact: true })).toBeVisible();
  await continueButton(page).click();

  await expect(page.getByText("3/4")).toBeVisible();
  await page.getByRole("radio", { name: "Homme" }).click();
  await page.getByRole("button", { name: "Suivant", exact: true }).click();
  await page.getByRole("button", { name: "Suivant", exact: true }).click();
  await continueButton(page).click();

  await expect(page.getByText("4/4")).toBeVisible();
  await expect(page.getByText("Ton palier")).toBeVisible();
  await expect(page.getByText(/Plus fort que \d+% des pratiquants/)).toBeVisible();
  await expect(page.getByText(/Tu démarres à/)).toBeVisible();

  await page.getByRole("button", { name: "Bats ce record" }).click();
  await expect(page.getByLabel("Email")).toBeVisible();

  expect(pageErrors).toEqual([]);
});
