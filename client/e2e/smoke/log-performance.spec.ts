import { expect, test } from "@playwright/test";
import { e2eCatalogExercise, e2eTrackedId } from "../fixtures/exercises";
import {
  seedAuthenticatedSession,
  seedOnboardingDone,
  trackPageErrors,
} from "./helpers";
import { mockExerciseWorkflowApi } from "./workflow-api";

test("renseigner une performance sur la fiche exercice", async ({ page }) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  await mockExerciseWorkflowApi(page, { seedTrackedExercise: true });

  await page.goto(`/#/exercise/${e2eTrackedId}`);

  await expect(
    page.locator("h1").filter({ hasText: e2eCatalogExercise.name }),
  ).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Nouvelle performance" }).click();

  await expect(
    page.getByRole("heading", { name: "Nouvelle performance" }),
  ).toBeVisible();

  const perfPost = page.waitForResponse(
    (response) =>
      response.url().includes("/performance-entries") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("dialog", { name: "Nouvelle performance" })
    .getByRole("button", { name: "Enregistrer" })
    .click();
  await perfPost;

  await expect(page.getByText("Dernier")).toBeVisible({ timeout: 10_000 });
  expect(pageErrors).toEqual([]);
});
