import { expect, test } from "@playwright/test";
import {
  mockAuthenticatedApi,
  seedAuthenticatedSession,
  seedOnboardingDone,
  trackPageErrors,
} from "./helpers";
import { UI } from "../../src/lib/translations";

test("cloche notifications visible sur l'accueil", async ({ page }) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  await mockAuthenticatedApi(page);

  await page.goto("/#/home");

  await expect(
    page.getByRole("button", { name: UI.notificationsBellAria }),
  ).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: UI.notificationsBellAria }).click();
  await expect(
    page.getByRole("dialog", { name: UI.notificationsFeedTitle }),
  ).toBeVisible();
  await expect(page.getByText(UI.notificationsEmpty)).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test("fermer le drawer marque les notifications non lues comme lues", async ({
  page,
}) => {
  const pageErrors = trackPageErrors(page);
  await seedOnboardingDone(page);
  await seedAuthenticatedSession(page);
  await mockAuthenticatedApi(page);

  let unreadCount = 2;
  const items = [
    {
      id: "n1",
      type: "friend_request",
      title: "Demande d'ami",
      body: "Alex veut t'ajouter",
      route: "/friends",
      sentAt: new Date().toISOString(),
      readAt: null as string | null,
    },
    {
      id: "n2",
      type: "message_new",
      title: "Nouveau message",
      body: "Salut !",
      route: "/messages",
      sentAt: new Date().toISOString(),
      readAt: null as string | null,
    },
  ];

  await page.route("**/notifications/feed**", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items, unreadCount }),
      });
      return;
    }
    if (method === "POST" && route.request().url().includes("/read")) {
      unreadCount = 0;
      const now = new Date().toISOString();
      for (const item of items) {
        item.readAt = now;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ unreadCount: 0 }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto("/#/home");

  const bellUnread = page.getByRole("button", {
    name: UI.notificationsBellAriaUnread.replace("{count}", "2"),
  });
  await expect(bellUnread).toBeVisible({ timeout: 10_000 });
  await bellUnread.click();

  await expect(
    page.getByRole("dialog", { name: UI.notificationsFeedTitle }),
  ).toBeVisible();

  const readRequest = page.waitForRequest(
    (req) =>
      req.method() === "POST" &&
      req.url().includes("/notifications/feed/read"),
  );
  await page.keyboard.press("Escape");
  await readRequest;

  await expect(
    page.getByRole("dialog", { name: UI.notificationsFeedTitle }),
  ).toBeHidden();
  await expect(
    page.getByRole("button", { name: UI.notificationsBellAria }),
  ).toBeVisible();

  expect(pageErrors).toEqual([]);
});
