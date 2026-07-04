import { expect, test } from "@playwright/test";
import { e2eCatalogExercise, e2eTrackedId } from "../fixtures/exercises";
import {
  seedAuthenticatedSession,
  seedOnboardingDone,
  trackPageErrors,
} from "./helpers";
import { mockExerciseWorkflowApi } from "./workflow-api";

test("ajouter un exercice depuis le catalogue", async ({ page }) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  await mockExerciseWorkflowApi(page);

  await page.goto("/#/exercises");

  await expect(page.getByText("Choisir des exercices")).toBeVisible();
  await page.getByPlaceholder("Rechercher un exercice...").fill(e2eCatalogExercise.name);
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "Ajouter et enregistrer une perf" }),
  ).toBeVisible();

  const perfPost = page.waitForResponse(
    (response) =>
      response.url().includes("/performance-entries") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("dialog", { name: "Ajouter et enregistrer une perf" })
    .getByRole("button", { name: "Enregistrer" })
    .click();
  await perfPost;

  await expect(page).toHaveURL(new RegExp(`#/exercise/${e2eTrackedId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), {
    timeout: 10_000,
  });
  expect(pageErrors).toEqual([]);
});
