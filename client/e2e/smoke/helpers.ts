import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { UI } from "../../src/lib/translations";

export const AUTH_STORAGE_KEY = "one-more-auth-v1";
export const ONBOARDING_DONE_KEY = "one-more-onboarding-v1";
export const ONBOARDING_GYM_PENDING_KEY = "one-more-onboarding-gym-pending-v1";
export const GYM_SETUP_DONE_KEY = "one-more-gym-setup-done-v1";
export const NOTIFICATIONS_EDU_DONE_KEY =
  "one-more-notifications-edu-done-v1";

/** Tours produit (Joyride) : évite l'overlay qui bloque les clics smoke. */
export const TOUR_COMPLETE_KEYS = [
  "one-more-onboarding-tour-complete-v1",
  "one-more-exercise-catalog-tour-complete-v1",
  "one-more-exercise-detail-tour-complete-v1",
  "one-more-rest-counter-tour-complete-v1",
  "one-more-home-tour-complete-v1",
] as const;

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
  await seedE2eApiOrigin(page);
  await page.addInitScript(
    ({ onboardingKey, notificationsEduKey }) => {
      localStorage.setItem(onboardingKey, "done");
      localStorage.setItem(notificationsEduKey, "1");
    },
    {
      onboardingKey: ONBOARDING_DONE_KEY,
      notificationsEduKey: NOTIFICATIONS_EDU_DONE_KEY,
    },
  );
}

export async function seedAuthenticatedSession(page: Page): Promise<void> {
  await seedE2eApiOrigin(page);
  await page.addInitScript(
    ({ authKey, onboardingKey, notificationsEduKey, session, tourKeys }) => {
      localStorage.setItem(onboardingKey, "done");
      localStorage.setItem(notificationsEduKey, "1");
      localStorage.setItem(authKey, JSON.stringify(session));
      for (const key of tourKeys) {
        localStorage.setItem(key, "1");
      }
    },
    {
      authKey: AUTH_STORAGE_KEY,
      onboardingKey: ONBOARDING_DONE_KEY,
      notificationsEduKey: NOTIFICATIONS_EDU_DONE_KEY,
      session: mockSession,
      tourKeys: [...TOUR_COMPLETE_KEYS],
    },
  );
}

/** Force l'API sur la même origine que le preview Vite pour que page.route() intercepte les POST. */
export async function seedE2eApiOrigin(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__ONE_MORE_API_URL__ = window.location.origin;
    window.__ONE_MORE_E2E__ = true;
  });
  await mockHealthApi(page);
}

/** Affiche la landing store même sous Playwright (bypass e2e du gate). */
export async function seedForceWebStoreLanding(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__ONE_MORE_FORCE_STORE_LANDING__ = true;
  });
}

export async function mockHealthApi(page: Page): Promise<void> {
  await page.route("**/health", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
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

  let savedProfile = {
    weightKg: 75,
    heightCm: 175,
    gender: "male" as "male" | "female",
    firstName: "Smoke",
    lastName: "Test",
    avatarUrl: null as string | null,
    username: "smoke_user",
    discoverySource: null as string | null,
    discoverySourceDetail: null as string | null,
  };

  await page.route("**/profile/discovery-source", async (route) => {
    if (route.request().method() !== "PUT") {
      await route.fallback();
      return;
    }
    const body = route.request().postDataJSON() as {
      source?: string;
      detail?: string | null;
    };
    if (!savedProfile.discoverySource) {
      savedProfile = {
        ...savedProfile,
        discoverySource: body.source ?? "skipped",
        discoverySourceDetail: body.detail ?? null,
      };
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.route("**/profile", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...savedProfile,
          updatedAt: new Date().toISOString(),
        }),
      });
      return;
    }
    if (method === "PUT") {
      const body = route.request().postDataJSON() as {
        weightKg?: number;
        heightCm?: number;
        gender?: "male" | "female";
        firstName?: string;
        lastName?: string;
        avatarUrl?: string | null;
        username?: string | null;
      };
      savedProfile = {
        ...savedProfile,
        weightKg: body.weightKg ?? savedProfile.weightKg,
        heightCm: body.heightCm ?? savedProfile.heightCm,
        gender: body.gender ?? savedProfile.gender,
        firstName: body.firstName ?? savedProfile.firstName,
        lastName: body.lastName ?? savedProfile.lastName,
        avatarUrl:
          body.avatarUrl !== undefined ? body.avatarUrl : savedProfile.avatarUrl,
        username:
          body.username !== undefined && body.username !== null
            ? body.username
            : savedProfile.username,
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...savedProfile,
          updatedAt: new Date().toISOString(),
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.route("**/progress**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        totalXp: 0,
        level: 1,
        xpIntoLevel: 0,
        xpForNextLevel: 100,
        streak: { current: 0, longest: 0 },
        streakXpBonus: {
          bonusPercent: 0,
          multiplier: 1,
          daysToMax: 7,
          isMax: false,
          progressToMax: 0,
        },
        lastActiveDate: null,
        recentGrants: [],
      }),
    });
  });

  await page.route("**/notifications/feed**", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], unreadCount: 0 }),
      });
      return;
    }
    if (method === "POST" && route.request().url().includes("/read")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ unreadCount: 0 }),
      });
      return;
    }
    await route.fallback();
  });

  await page.route("**/notifications/preferences**", async (route) => {
    const method = route.request().method();
    if (method === "GET" || method === "PATCH") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          streakReminders: true,
          friendRequests: true,
          friendAccepted: true,
          messages: true,
          sessionComments: true,
          friendTraining: true,
          friendRecords: true,
          weeklyRecap: true,
          reminderWeekdays: [1, 3, 5],
          reminderHour: 18,
          reminderMinute: 0,
          reminderSlots: [
            { weekday: 1, hour: 18, minute: 0 },
            { weekday: 3, hour: 18, minute: 0 },
            { weekday: 5, hour: 18, minute: 0 },
          ],
        }),
      });
      return;
    }
    await route.fallback();
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

  await page.route("**/messaging/conversations**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ conversations: [] }),
    });
  });

  await page.route("**/social/friends**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        friends: [],
        pendingIncoming: [],
        pendingOutgoing: [],
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
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
      return;
    }
    if (method === "POST") {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      const now = new Date().toISOString();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...body,
          updatedAt: now,
          deletedAt: null,
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.route("**/performance-entries**", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
      return;
    }
    if (method === "POST") {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      const now = new Date().toISOString();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...body,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          xp: {
            totalXp: 10,
            level: 1,
            xpIntoLevel: 10,
            xpForNextLevel: 100,
            leveledUp: false,
            grants: [{ sourceType: "perf", amount: 10 }],
            streak: { current: 1, longest: 1 },
            league: null,
          },
        }),
      });
      return;
    }
    await route.fallback();
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

/** Ouvre le flow email depuis l'écran methods, puis soumet l'adresse. */
export async function continueWithEmailFlow(
  page: Page,
  email: string,
): Promise<void> {
  await page
    .getByRole("button", { name: "Continuer avec l'email", exact: true })
    .click();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
}

/** Après register : passe discovery puis notifs (web) s'ils s'affichent. */
export async function dismissPostAuthDiscoveryAndNotifications(
  page: Page,
): Promise<void> {
  const postAuthUrl =
    /#\/(onboarding\?(?:.*&)?step=(discovery|notifications)|home|exercises|exercise\/)/;

  await expect.poll(() => postAuthUrl.test(page.url()), { timeout: 10_000 }).toBe(
    true,
  );

  if (page.url().includes("step=discovery")) {
    await page
      .getByRole("button", { name: UI.onboardingSkip, exact: true })
      .click();
    await expect
      .poll(
        () =>
          /#\/(onboarding\?(?:.*&)?step=notifications|home|exercises|exercise\/)/.test(
            page.url(),
          ),
        { timeout: 10_000 },
      )
      .toBe(true);
  }

  if (page.url().includes("step=notifications")) {
    await page
      .getByRole("button", { name: UI.onboardingSkip, exact: true })
      .click();
    await expect
      .poll(
        () => /#\/(home|exercises|exercise\/)/.test(page.url()),
        { timeout: 10_000 },
      )
      .toBe(true);
  }
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
