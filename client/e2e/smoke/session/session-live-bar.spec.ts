import { expect, test } from "@playwright/test";
import { e2eCatalogExercise, e2eTrackedId } from "../../fixtures/exercises";
import { UI } from "../../../src/lib/translations";
import {
  seedAuthenticatedSession,
  seedOnboardingDone,
  trackPageErrors,
} from "../helpers";
import { mockExerciseWorkflowApi } from "../workflow-api";

test("barre de séance : repos, passer, terminer, visible sur la fiche exercice", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  await mockExerciseWorkflowApi(page, {
    seedTrackedExercise: true,
    seedPerformance: true,
  });

  await page.goto("/#/home");

  // `data-session-live-bar` : éviter le `<section>` accueil aussi nommé « Séance en cours ».
  // Sur l'accueil, la rangée exo n'est pas dans la barre (seulement repos / séance).
  const bar = page.locator("[data-session-live-bar]").getByRole("region", {
    name: UI.sessionBarA11y,
  });
  await expect(bar).toBeVisible({ timeout: 10_000 });

  // Une série vient d'être enregistrée : la rangée repos est affichée.
  await expect(bar.getByText(UI.restSinceLastSet, { exact: true })).toBeVisible();
  await bar.getByRole("button", { name: UI.sessionBarRestPassAria }).click();

  // Passer le repos affiche la rangée séance + Terminer.
  const finish = bar.getByRole("button", { name: UI.sessionBarFinishAria });
  await expect(finish).toBeVisible();
  await finish.click();

  const drawer = page.getByRole("dialog", { name: UI.endSessionTitle });
  await expect(drawer).toBeVisible();
  await drawer
    .getByRole("button", { name: UI.endSessionContinue })
    .click();
  await expect(drawer).toBeHidden();

  // La barre suit sur la fiche exercice (sans barre repos fine en doublon).
  await page.goto(`/#/exercise/${e2eTrackedId}`);
  await expect(
    page.locator("h1").filter({ hasText: e2eCatalogExercise.name }),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    page.locator("[data-session-live-bar]").getByRole("region", {
      name: UI.sessionBarA11y,
    }),
  ).toBeVisible();

  expect(pageErrors).toEqual([]);
});
