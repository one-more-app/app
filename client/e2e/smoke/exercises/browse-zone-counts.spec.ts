import { expect, test } from "@playwright/test";
import { UI } from "../../../src/lib/translations";
import {
  seedAuthenticatedSession,
  seedOnboardingDone,
  trackPageErrors,
} from "../helpers";
import { mockExerciseWorkflowApi } from "../workflow-api";

test("exercices : les zones affichent n suivis et n disponibles", async ({
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
  await expect(page.getByText("1 suivi", { exact: true })).toBeVisible();

  expect(pageErrors).toEqual([]);
});
