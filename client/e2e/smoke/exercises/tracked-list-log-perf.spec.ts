import { expect, test } from "@playwright/test";
import { e2eCatalogExercise, e2eTrackedId } from "../../fixtures/exercises";
import { UI } from "../../../src/lib/translations";
import {
  seedAuthenticatedSession,
  seedOnboardingDone,
  trackPageErrors,
} from "../helpers";
import { mockExerciseWorkflowApi } from "../workflow-api";

test("perf depuis la liste suivis ouvre la fiche exercice", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  await mockExerciseWorkflowApi(page, { seedTrackedExercise: true });

  await page.goto("/#/exercises");

  await expect(page.getByText(UI.browseYourExercisesTitle)).toBeVisible({
    timeout: 10_000,
  });
  await page
    .getByPlaceholder(UI.searchExercise)
    .fill(e2eCatalogExercise.name);
  await expect(page.getByText(e2eCatalogExercise.name)).toBeVisible({
    timeout: 10_000,
  });

  await page.getByRole("button", { name: UI.newPerf }).click();

  await expect(
    page.getByRole("heading", { name: UI.newPerf }),
  ).toBeVisible();

  const perfPost = page.waitForResponse(
    (response) =>
      response.url().includes("/performance-entries") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("dialog", { name: UI.newPerf })
    .getByRole("button", { name: UI.save })
    .click();
  await perfPost;

  await expect(page).toHaveURL(
    new RegExp(
      `#/exercise/${e2eTrackedId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    ),
    { timeout: 10_000 },
  );
  await expect(
    page.locator("h1").filter({ hasText: e2eCatalogExercise.name }),
  ).toBeVisible();
  expect(pageErrors).toEqual([]);
});
