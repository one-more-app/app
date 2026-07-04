import type { Page } from "@playwright/test";

export const AUTH_STORAGE_KEY = "one-more-auth-v1";
export const ONBOARDING_DONE_KEY = "one-more-onboarding-v1";

export const mockSession = {
  accessToken: "smoke-access-token",
  refreshToken: "smoke-refresh-token",
  user: {
    id: "smoke-user-1",
    email: "smoke@one-more.test",
  },
};

export function trackPageErrors(page: Page): string[] {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  return pageErrors;
}

export async function seedOnboardingDone(page: Page): Promise<void> {
  await page.addInitScript((key) => {
    localStorage.setItem(key, "done");
  }, ONBOARDING_DONE_KEY);
}

export async function seedAuthenticatedSession(page: Page): Promise<void> {
  await page.addInitScript(
    ({ authKey, onboardingKey, session }) => {
      localStorage.setItem(onboardingKey, "done");
      localStorage.setItem(authKey, JSON.stringify(session));
    },
    {
      authKey: AUTH_STORAGE_KEY,
      onboardingKey: ONBOARDING_DONE_KEY,
      session: mockSession,
    },
  );
}

/** Force l'API sur la même origine que le preview Vite pour que page.route() intercepte les POST. */
export async function seedE2eApiOrigin(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__ONE_MORE_API_URL__ = window.location.origin;
  });
}

export async function mockCoreAuthenticatedApi(page: Page): Promise<void> {
  await seedE2eApiOrigin(page);
  await page.route("**/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockSession),
    });
  });

  await page.route("**/auth/logout", async (route) => {
    await route.fulfill({ status: 200, body: "" });
  });

  await page.route("**/profile", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          weightKg: 75,
          heightCm: 175,
          gender: "male",
          firstName: "Smoke",
          lastName: "Test",
          avatarUrl: null,
          username: "smoke_user",
          updatedAt: new Date().toISOString(),
        }),
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/progress**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        xp: 0,
        level: 1,
        streak: { current: 0, longest: 0 },
      }),
    });
  });

  await page.route("**/me/access**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        exerciseLimit: 10,
        activeExerciseCount: 0,
        canAddExercise: true,
        referralCount: 0,
        hasUsedReferralCode: false,
        bonusFromReferrals: 0,
        bonusFromBeingReferred: 0,
        isPremium: false,
        tshirtRewardEligible: false,
        referralsUntilTshirt: 3,
      }),
    });
  });
}

export async function mockAuthApi(page: Page): Promise<void> {
  await page.route("**/auth/identify", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ exists: false }),
    });
  });

  await page.route("**/auth/username/suggest*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ suggested: "smoke_user", available: "smoke_user" }),
    });
  });

  await page.route("**/auth/username/check*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        available: true,
        username: "smoke_user",
        reason: null,
      }),
    });
  });

  await page.route("**/auth/register", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockSession),
    });
  });

  await mockCoreAuthenticatedApi(page);

  await page.route("**/tracked-exercises**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

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
      body: JSON.stringify({ items: [], total: 0 }),
    });
  });
}

export async function mockAuthenticatedApi(page: Page): Promise<void> {
  await mockCoreAuthenticatedApi(page);

  await page.route("**/tracked-exercises**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/performance-entries**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
}
