import type { Page } from "@playwright/test";

export const AUTH_STORAGE_KEY = "one-more-auth-v1";
export const ONBOARDING_DONE_KEY = "one-more-onboarding-v1";
export const ONBOARDING_GYM_PENDING_KEY = "one-more-onboarding-gym-pending-v1";
export const GYM_SETUP_DONE_KEY = "one-more-gym-setup-done-v1";

export const mockGymPlace = {
  placeId: "e2e-gym-1",
  name: "Basic Fit Smoke",
  address: "1 rue Test, Paris",
  lat: 48.8566,
  lng: 2.3522,
  distanceM: 50,
};

export async function mockGymsApi(
  page: Page,
  options?: { seedGym?: { onboardingGymPending?: boolean } },
): Promise<void> {
  let savedGym:
    | (typeof mockGymPlace & {
        radiusM: number;
        onboardingGymPending: boolean;
        geofenceEnabled: boolean;
        updatedAt: string;
      })
    | null = options?.seedGym
    ? {
        ...mockGymPlace,
        radiusM: 120,
        onboardingGymPending: options.seedGym.onboardingGymPending ?? false,
        geofenceEnabled: true,
        updatedAt: new Date().toISOString(),
      }
    : null;

  await page.route("**/gyms/search**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results: [mockGymPlace] }),
    });
  });

  await page.route("**/gyms/places/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ place: mockGymPlace }),
    });
  });

  await page.route("**/gyms/me/from-location", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ candidate: mockGymPlace }),
    });
  });

  await page.route("**/gyms/me**", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ gym: savedGym }),
      });
      return;
    }
    if (method === "PUT") {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      savedGym = {
        ...mockGymPlace,
        radiusM: (body.radiusM as number) ?? 120,
        onboardingGymPending: Boolean(body.onboardingGymPending),
        geofenceEnabled: body.geofenceEnabled !== false,
        updatedAt: new Date().toISOString(),
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ gym: savedGym }),
      });
      return;
    }
    if (method === "DELETE") {
      savedGym = null;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
      return;
    }
    if (method === "POST" && route.request().url().includes("clear-onboarding-pending")) {
      if (savedGym) savedGym.onboardingGymPending = false;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
      return;
    }
    await route.fallback();
  });
}

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
    const cause =
      error.cause instanceof Error
        ? error.cause.message
        : typeof error.cause === "string"
          ? error.cause
          : null;
    if (cause) {
      pageErrors.push(cause);
      return;
    }
    if (/Minified React error #520/.test(error.message)) {
      return;
    }
    if (/_leaflet_pos/.test(error.message)) {
      return;
    }
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

type MockGymsApiOptions = { seedGym?: { onboardingGymPending?: boolean } };

export async function mockCoreAuthenticatedApi(
  page: Page,
  gymOptions?: MockGymsApiOptions,
): Promise<void> {
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

  await page.route("**/me/rewards/tshirt**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ pendingRewards: [], claims: [] }),
    });
  });

  await page.route("**/league/browse-lookups**", async (route) => {
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

  await mockGymsApi(page, gymOptions);
}

export async function mockAuthApi(
  page: Page,
  gymOptions?: MockGymsApiOptions,
): Promise<void> {
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

  await mockCoreAuthenticatedApi(page, gymOptions);

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
