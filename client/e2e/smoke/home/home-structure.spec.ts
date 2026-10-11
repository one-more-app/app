import { expect, test, type Page } from "@playwright/test";
import { UI } from "../../../src/lib/translations";
import {
  seedAuthenticatedSession,
  seedOnboardingDone,
  trackPageErrors,
} from "../helpers";
import { mockExerciseWorkflowApi } from "../workflow-api";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function weekIndex(date: Date): number {
  const js = date.getDay();
  return js === 0 ? 6 : js - 1;
}

function tabName(date: Date): string {
  return UI.homeWeekDaySelect
    .replace("{day}", WEEKDAYS[weekIndex(date)])
    .replace("{date}", String(date.getDate()));
}

function isAfterThisWeek(date: Date, today: Date): boolean {
  const sunday = addDays(today, 6 - weekIndex(today));
  sunday.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return target > sunday;
}

async function selectHomeDay(
  page: Page,
  date: Date,
  today: Date,
  shifted: { current: number },
) {
  const targetShift = isAfterThisWeek(date, today) ? 1 : 0;
  while (shifted.current < targetShift) {
    await page.getByRole("button", { name: UI.historyWeekNext }).click();
    shifted.current += 1;
  }
  await page.getByRole("tab", { name: tabName(date), exact: true }).click();
}

test("accueil : semaine, rappel prochaine séance et CTA démarrer une séance", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  // Exercice suivi, aucune perf : pas « Ta première séance ».
  await mockExerciseWorkflowApi(page, { seedTrackedExercise: true });

  await page.goto("/#/home");

  await expect(
    page.getByRole("tablist", { name: UI.homeWeekNavLabel }),
  ).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(UI.homeWeekToday, { exact: true })).toBeVisible();
  await expect(
    page.getByRole("tab", { name: tabName(new Date()), exact: true }),
  ).toHaveAttribute("aria-selected", "true");

  const card = page.getByRole("region", { name: UI.homeNextSessionTitle });
  await expect(card).toBeVisible();
  await expect(page.getByText(UI.homeFirstSessionTitle)).toHaveCount(0);

  const today = new Date();
  const tomorrow = addDays(today, 1);
  const dayAfter = addDays(today, 2);
  const shifted = { current: 0 };

  await selectHomeDay(page, tomorrow, today, shifted);
  await expect(
    page.getByRole("region", { name: UI.homeNextSessionTitle }),
  ).toBeVisible();

  await selectHomeDay(page, dayAfter, today, shifted);
  await expect(page.getByText(UI.homeFutureTitle)).toBeVisible();
  await expect(
    page.getByRole("region", { name: UI.homeNextSessionTitle }),
  ).toHaveCount(0);

  const cta = page.getByRole("button", { name: UI.homeStartSession });
  await expect(cta).toBeVisible();
  await cta.click();
  await expect(page).toHaveURL(/#\/exercises/);

  expect(pageErrors).toEqual([]);
});
