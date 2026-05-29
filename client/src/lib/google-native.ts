import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";

let initPromise: Promise<void> | null = null;

function requiredEnv(name: string): string {
  const value = String(import.meta.env[name] ?? "").trim();
  if (!value) throw new Error(`Variable manquante: ${name}`);
  return value;
}

export async function initGoogleNativeSignIn(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (initPromise) return initPromise;

  initPromise = SocialLogin.initialize({
    google: {
      webClientId: requiredEnv("VITE_GOOGLE_WEB_CLIENT_ID"),
      iOSClientId: requiredEnv("VITE_GOOGLE_CLIENT_ID_IOS"),
      mode: "online",
    },
  })
    .then(() => undefined)
    .catch((error) => {
      initPromise = null;
      throw error;
    });

  return initPromise;
}

export async function loginWithGoogleNative(): Promise<string> {
  await initGoogleNativeSignIn();

  const res = await SocialLogin.login({
    provider: "google",
    options: {
      scopes: ["email", "profile"],
    },
  });

  if (res.provider !== "google") {
    throw new Error("Réponse Google inattendue");
  }

  const idToken =
    "idToken" in res.result ? res.result.idToken : null;
  if (!idToken) throw new Error("id_token Google manquant");

  return idToken;
}
