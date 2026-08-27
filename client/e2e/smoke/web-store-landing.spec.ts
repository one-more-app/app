import { expect, test } from "@playwright/test";
import { seedForceWebStoreLanding, trackPageErrors } from "./helpers";
import { UI } from "../../src/lib/translations";

const ONELINK_DOWNLOAD_URL = "https://one-more.onelink.me/XFST";

test("landing store web : un CTA OneLink iOS et Android", async ({ page }) => {
  const pageErrors = trackPageErrors(page);
  await seedForceWebStoreLanding(page);

  await page.goto("/#/home");

  await expect(
    page.getByRole("heading", { name: UI.onboardingTitle }),
  ).toBeVisible();
  await expect(page.getByText(UI.onboardingDescription)).toBeVisible();
  await expect(page.getByText(UI.webStoreLandingStores)).toBeVisible();

  const cta = page.getByRole("link", { name: UI.webStoreLandingCta });
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute("href", ONELINK_DOWNLOAD_URL);

  const iosLogo = page.getByRole("link", { name: UI.webStoreLandingIosAlt });
  const androidLogo = page.getByRole("link", {
    name: UI.webStoreLandingAndroidAlt,
  });
  await expect(iosLogo).toBeVisible();
  await expect(androidLogo).toBeVisible();
  await expect(iosLogo).toHaveAttribute("href", ONELINK_DOWNLOAD_URL);
  await expect(androidLogo).toHaveAttribute("href", ONELINK_DOWNLOAD_URL);

  const storeLinks = page.locator(`a[href="${ONELINK_DOWNLOAD_URL}"]`);
  await expect(storeLinks).toHaveCount(3);

  expect(pageErrors).toEqual([]);
});
