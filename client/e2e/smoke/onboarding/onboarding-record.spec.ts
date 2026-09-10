import { expect, test, type Page } from "@playwright/test";
import { e2eCatalogExercise } from "../../fixtures/exercises";
import { mockAuthApi, trackPageErrors } from "../helpers";
import { UI } from "../../../src/lib/translations";

async function seedOnboardingDraftProfile(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const sessionId = crypto.randomUUID();
    sessionStorage.setItem("one-more-onboarding-draft-session-v1", sessionId);
    localStorage.setItem(
      "one-more-pending-onboarding-profile-v1",
      JSON.stringify({
        weightKg: 75,
        heightCm: 175,
        gender: "male",
        sessionId,
      }),
    );
  });
}

async function submitStarterRecord(page: Page): Promise<void> {
  await expect(page.getByText(UI.onboardingRecordTitle)).toBeVisible();
  await page.getByRole("button", { name: /Développé couché/ }).click();

  const drawer = page.getByRole("dialog", { name: "Rentre ton record" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", { name: "Enregistrer" }).click();
}

async function mockOnboardingCatalogApi(page: Page): Promise<void> {
  await page.route("**/exercises/meta", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        targets: ["pectorals"],
        equipment: ["barbell", "body weight"],
      }),
    });
  });
  await page.route(/\/exercises(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [e2eCatalogExercise],
        total: 1,
      }),
    });
  });
  await page.route("**/league/browse-lookups", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        byZone: {},
        targetInZone: {},
        equipmentInPath: {},
      }),
    });
  });
}

test("voir plus d'exercices ouvre le catalogue puis revient au record", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await mockAuthApi(page);

  await page.goto("/#/onboarding?step=record");
  await expect(page.getByText(UI.onboardingRecordTitle)).toBeVisible();

  await page.getByRole("button", { name: UI.onboardingSeeMoreExercises }).click();
  await expect(page).toHaveURL(/#\/exercises\?from=onboarding/);
  await expect(page.getByRole("heading", { name: UI.chooseExercises })).toBeVisible();

  await page.getByRole("button", { name: UI.back }).click();
  await expect(page.getByText(UI.onboardingRecordTitle)).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("changer d'exo via le catalogue après retour garde le nouvel exo", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDraftProfile(page);
  await mockAuthApi(page);
  await mockOnboardingCatalogApi(page);

  await page.goto("/#/onboarding?step=record");
  await submitStarterRecord(page);
  await expect(page.getByRole("heading", { name: "Ton palier" })).toBeVisible();
  await expect(page.getByText("Développé couché").first()).toBeVisible();

  await page.goto("/#/onboarding?step=record");
  await expect(page.getByText(UI.onboardingRecordTitle)).toBeVisible();

  await page.getByRole("button", { name: UI.onboardingSeeMoreExercises }).click();
  await expect(page).toHaveURL(/#\/exercises\?from=onboarding/);
  await page.getByPlaceholder(UI.searchExercise).fill(e2eCatalogExercise.name);
  await page.getByRole("button", { name: UI.add, exact: true }).click();
  await expect(page).toHaveURL(/#\/exercises\?from=onboarding/);

  const drawer = page.getByRole("dialog", { name: UI.onboardingPerfTitle });
  await expect(drawer).toBeVisible();

  await drawer.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page).toHaveURL(/#\/onboarding\?step=rank/);

  const pendingAfterSave = await page.evaluate(() => {
    const raw = localStorage.getItem("one-more-pending-onboarding-record-v1");
    return raw
      ? (JSON.parse(raw) as { exerciseId: string; originalName: string })
      : null;
  });
  expect(pendingAfterSave?.exerciseId).toBe(e2eCatalogExercise.id);
  expect(pendingAfterSave?.originalName).toBe(e2eCatalogExercise.name);

  await expect(page.getByRole("heading", { name: "Ton palier" })).toBeVisible();
  await expect(page.getByText(e2eCatalogExercise.name).first()).toBeVisible();
  await expect(page.getByText("Développé couché")).toHaveCount(0);

  expect(pageErrors).toEqual([]);
});

test("l'onboarding record montre le palier puis le compte", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDraftProfile(page);
  await mockAuthApi(page);

  await page.goto("/#/onboarding?step=record");

  await submitStarterRecord(page);

  await expect(page.getByRole("heading", { name: "Ton palier" })).toBeVisible();
  await expect(page.getByText("Développé couché").first()).toBeVisible();
  await expect(page.getByText("Record", { exact: true })).toBeVisible();
  await expect(page.getByText("Dernier", { exact: true })).toHaveCount(0);
  await expect(page.getByText("60", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("× 5").first()).toBeVisible();
  await expect(page.getByText(/Plus fort que \d+% des pratiquants/)).toBeVisible();
  await expect(page.getByText(/Tu es /)).toBeVisible();
  await expect(page.getByText(/Il te manque/)).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "Créer mon compte et sauvegarder" }).click();
  await expect(
    page.getByRole("button", { name: "Continuer avec l'email", exact: true }),
  ).toBeVisible();

  const pending = await page.evaluate(() => {
    const raw = localStorage.getItem("one-more-pending-onboarding-record-v1");
    return raw ? (JSON.parse(raw) as { exerciseId: string; gifUrl?: string }) : null;
  });
  expect(pending?.exerciseId).toBe("EIeI8Vf");
  expect(pending?.gifUrl).toBe("https://static.exercisedb.dev/media/EIeI8Vf.gif");

  expect(pageErrors).toEqual([]);
});
