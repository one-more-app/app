import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";

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

export async function loginWithGoogleNative(): Promise<string> {
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

    return idToken;
  });
}

export async function loginWithAppleNative(): Promise<string> {
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

  return idToken;
}
