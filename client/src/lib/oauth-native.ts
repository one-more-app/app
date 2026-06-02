import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";

let initPromise: Promise<void> | null = null;

function requiredEnv(name: string): string {
  const value = String(import.meta.env[name] ?? "").trim();
  if (!value) throw new Error(`Variable manquante: ${name}`);
  return value;
}

function optionalEnv(name: string): string {
  return String(import.meta.env[name] ?? "").trim();
}

export async function initNativeSocialSignIn(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (initPromise) return initPromise;

  const initConfig: Parameters<typeof SocialLogin.initialize>[0] = {
    google: {
      webClientId: requiredEnv("VITE_GOOGLE_WEB_CLIENT_ID"),
      iOSClientId: requiredEnv("VITE_GOOGLE_CLIENT_ID_IOS"),
      mode: "online",
    },
  };

  if (Capacitor.getPlatform() === "ios") {
    initConfig.apple = {
      clientId: requiredEnv("VITE_APPLE_CLIENT_ID"),
      redirectUrl: "",
    };
  } else {
    const appleRedirectUrl = optionalEnv("VITE_APPLE_REDIRECT_URL");
    if (appleRedirectUrl) {
      initConfig.apple = {
        clientId: requiredEnv("VITE_APPLE_CLIENT_ID"),
        redirectUrl: appleRedirectUrl,
      };
    }
  }

  initPromise = SocialLogin.initialize(initConfig)
    .then(() => undefined)
    .catch((error) => {
      initPromise = null;
      throw error;
    });

  return initPromise;
}

export async function loginWithGoogleNative(): Promise<string> {
  await initNativeSocialSignIn();

  const res = await SocialLogin.login({
    provider: "google",
    options: {
      scopes: ["email", "profile"],
    },
  });

  if (res.provider !== "google") {
    throw new Error("Réponse Google inattendue");
  }

  const idToken = "idToken" in res.result ? res.result.idToken : null;
  if (!idToken) throw new Error("id_token Google manquant");

  return idToken;
}

export async function loginWithAppleNative(): Promise<string> {
  await initNativeSocialSignIn();

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
