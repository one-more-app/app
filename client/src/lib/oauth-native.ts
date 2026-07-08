import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";

export type NativeOAuthIdentity = {
  idToken: string;
  firstName: string | null;
  lastName: string | null;
};

function requiredEnv(name: string): string {
  const value = String(import.meta.env[name] ?? "").trim();
  if (!value) throw new Error(`Variable manquante: ${name}`);
  return value;
}

function optionalEnv(name: string): string {
  return String(import.meta.env[name] ?? "").trim();
}

/** Comme Moneyes : init Google au moment du tap, pas au démarrage de l'app. */
async function initializeGoogleForLogin(): Promise<void> {
  const isIOS = Capacitor.getPlatform() === "ios";
  if (isIOS) {
    await SocialLogin.initialize({
      google: {
        iOSClientId: requiredEnv("VITE_GOOGLE_CLIENT_ID_IOS"),
      },
    });
    return;
  }
  await SocialLogin.initialize({
    google: {
      webClientId: requiredEnv("VITE_GOOGLE_WEB_CLIENT_ID"),
    },
  });
}

async function initializeAppleForLogin(): Promise<void> {
  const isIOS = Capacitor.getPlatform() === "ios";
  const initConfig: Parameters<typeof SocialLogin.initialize>[0] = {};

  if (isIOS) {
    initConfig.apple = {
      clientId: requiredEnv("VITE_APPLE_CLIENT_ID"),
      redirectUrl: "",
    };
  } else {
    const appleRedirectUrl = optionalEnv("VITE_APPLE_REDIRECT_URL");
    if (!appleRedirectUrl) return;
    initConfig.apple = {
      clientId: requiredEnv("VITE_APPLE_CLIENT_ID"),
      redirectUrl: appleRedirectUrl,
    };
  }

  if (initConfig.apple) {
    await SocialLogin.initialize(initConfig);
  }
}

/** @deprecated Init au démarrage — préférer init au tap (Moneyes). Conservé pour compat. */
export async function initNativeSocialSignIn(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await initializeGoogleForLogin().catch(() => undefined);
  await initializeAppleForLogin().catch(() => undefined);
}

async function withAndroidBackButtonMuted<T>(fn: () => Promise<T>): Promise<T> {
  if (Capacitor.getPlatform() !== "android") return fn();

  const listener = await App.addListener("backButton", () => {
    /* Ne pas propager le back vers l'app pendant le picker Google. */
  });
  try {
    return await fn();
  } finally {
    await listener.remove();
  }
}

function normalizeName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function splitDisplayName(displayName: string): {
  firstName: string | null;
  lastName: string | null;
} {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0] ?? null, lastName: null };
  return {
    firstName: parts[0] ?? null,
    lastName: parts.slice(1).join(" ") || null,
  };
}

function extractNamesFromSocialLoginResult(result: unknown): {
  firstName: string | null;
  lastName: string | null;
} {
  if (!result || typeof result !== "object") {
    return { firstName: null, lastName: null };
  }

  const obj = result as Record<string, unknown>;
  const directFirstName = normalizeName(
    obj.givenName ?? obj.firstName ?? obj.name,
  );
  const directLastName = normalizeName(obj.familyName ?? obj.lastName);
  if (directFirstName || directLastName) {
    return {
      firstName: directFirstName,
      lastName: directLastName,
    };
  }

  const userObj =
    obj.user && typeof obj.user === "object"
      ? (obj.user as Record<string, unknown>)
      : null;
  if (!userObj) return { firstName: null, lastName: null };

  const nestedFirstName = normalizeName(
    userObj.givenName ?? userObj.firstName ?? userObj.name,
  );
  const nestedLastName = normalizeName(userObj.familyName ?? userObj.lastName);
  if (nestedFirstName || nestedLastName) {
    return {
      firstName: nestedFirstName,
      lastName: nestedLastName,
    };
  }

  const fullName = normalizeName(userObj.displayName ?? userObj.fullName);
  if (!fullName) return { firstName: null, lastName: null };
  return splitDisplayName(fullName);
}

export async function loginWithGoogleNative(): Promise<NativeOAuthIdentity> {
  return withAndroidBackButtonMuted(async () => {
    await initializeGoogleForLogin();

    const res = await SocialLogin.login({
      provider: "google",
      options: {
        scopes: ["profile", "email"],
      },
    });

    if (res.provider !== "google") {
      throw new Error("Réponse Google inattendue");
    }

    const idToken = "idToken" in res.result ? res.result.idToken : null;
    if (!idToken) throw new Error("id_token Google manquant");

    const { firstName, lastName } = extractNamesFromSocialLoginResult(res.result);
    return { idToken, firstName, lastName };
  });
}

export async function loginWithAppleNative(): Promise<NativeOAuthIdentity> {
  await initializeAppleForLogin();

  const res = await SocialLogin.login({
    provider: "apple",
    options: {
      scopes: ["email", "name"],
    },
  });

  if (res.provider !== "apple") {
    throw new Error("Réponse Apple inattendue");
  }

  const idToken = "idToken" in res.result ? res.result.idToken : null;
  if (!idToken) throw new Error("id_token Apple manquant");

  const { firstName, lastName } = extractNamesFromSocialLoginResult(res.result);
  return { idToken, firstName, lastName };
}
