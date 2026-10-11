import { expect, test } from "@playwright/test";
import { UI } from "../../../src/lib/translations";
import {
  seedAuthenticatedSession,
  seedOnboardingDone,
  trackPageErrors,
} from "../helpers";
import { mockExerciseWorkflowApi } from "../workflow-api";

test("démarrer une séance : pas de paywall si limite d'exercices atteinte", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  await mockExerciseWorkflowApi(page, { seedTrackedExercise: true });

  // Limite atteinte : on peut quand même démarrer avec des exercices déjà suivis.
  await page.route("**/me/access**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        exerciseLimit: 3,
        activeExerciseCount: 3,
        canAddExercise: false,
        referralCount: 0,
        hasUsedReferralCode: false,
        bonusFromReferrals: 0,
        bonusFromBeingReferred: 0,
        isPremium: false,
        tshirtRewardEligible: false,
        referralsUntilTshirt: 3,
        referralRewardKind: null,
      }),
    });
  });

  await page.goto("/#/home");

  const cta = page.getByRole("button", { name: UI.homeStartSession });
  await expect(cta).toBeVisible({ timeout: 10_000 });
  await cta.click();

  await expect(page).toHaveURL(/#\/exercises/);
  await expect(
    page.getByText(UI.exerciseLimitTitle, { exact: true }),
  ).toHaveCount(0);

  expect(pageErrors).toEqual([]);
});
