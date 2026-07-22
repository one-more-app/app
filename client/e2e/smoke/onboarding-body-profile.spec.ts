import { expect, test, type Page } from "@playwright/test";
import { mockAuthApi, trackPageErrors } from "./helpers";

const continueButton = (page: Page) =>
  page.getByRole("button", { name: "Continuer", exact: true });

const nextButton = (page: Page) =>
  page.getByRole("button", { name: "Suivant", exact: true });

test("l'onboarding body (genre) est envoyé dans le register", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await mockAuthApi(page);

  const registerBodies: Array<{
    weightKg?: number;
    heightCm?: number;
    gender?: string;
  }> = [];
  page.on("request", (request) => {
    if (request.method() !== "POST") return;
    if (!request.url().includes("/auth/register")) return;
    registerBodies.push(
      request.postDataJSON() as (typeof registerBodies)[number],
    );
  });

  await page.goto("/#/onboarding");

  await continueButton(page).click();

  await page.getByRole("radio", { name: "Femme" }).click();
  await nextButton(page).click();

  await nextButton(page).click();
  await continueButton(page).click();

  await page.getByLabel("Email").fill("body-onboarding@one-more.test");
  await continueButton(page).click();

  await page.getByLabel("Prénom").fill("Body");
  await continueButton(page).click();

  await page.getByLabel("Nom").fill("Onboarding");
  await continueButton(page).click();

  await page.getByLabel("Pseudo").fill("smoke_user");
  await expect(page.getByText("Pseudo disponible")).toBeVisible({
    timeout: 5_000,
  });
  await continueButton(page).click();

  await page.getByLabel("Mot de passe", { exact: true }).fill("password123");
  await page.getByLabel("Confirmer le mot de passe").fill("password123");
  await continueButton(page).click();

  await page.getByRole("button", { name: "Créer un compte" }).click();

  await expect
    .poll(() => registerBodies.some((body) => body.gender === "female"), {
      timeout: 10_000,
    })
    .toBe(true);

  const bodyRegister = registerBodies.find((body) => body.gender === "female");
  expect(bodyRegister).toMatchObject({
    gender: "female",
    weightKg: 75,
    heightCm: 175,
  });

  expect(pageErrors).toEqual([]);
});
