import { apiFetch } from "@/lib/api";
import type { AuthSession } from "@/lib/auth";
import { clearPendingInviteCode, peekPendingInviteCode } from "@/lib/invite-code";
import {
  loginWithAppleNative,
  loginWithGoogleNative,
} from "@/lib/oauth-native";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

type Provider = "google" | "apple";
type Platform = "android" | "ios";

function base64UrlEncode(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  const base64 = btoa(str);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomString(len: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return base64UrlEncode(bytes).slice(0, len);
}

async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

function defaultRedirectUri(): string {
  const platform = Capacitor.getPlatform();
  if (platform === "android") return "com.one_more.app:/oauth";
  return "com.onemore.app:/oauth";
}

function oauthPlatform(): Platform {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") return "ios";
  if (platform === "android") return "android";
  throw new Error("OAuth mobile disponible uniquement sur iOS et Android");
}

export async function signInWithGoogle(): Promise<AuthSession> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("Connexion Google disponible uniquement sur l'application mobile");
  }

  const platform = oauthPlatform();
  const idToken = await loginWithGoogleNative();
  const inviteCode = peekPendingInviteCode() ?? undefined;
  const session = await apiFetch<AuthSession>("/oauth/google/id-token", {
    method: "POST",
    body: JSON.stringify({ idToken, platform, inviteCode }),
  });
  clearPendingInviteCode();
  return session;
}

export async function signInWithApple(): Promise<AuthSession> {
  if (Capacitor.getPlatform() !== "ios") {
    throw new Error("Connexion Apple disponible uniquement sur iOS");
  }

  const platform = oauthPlatform();
  const idToken = await loginWithAppleNative();
  const inviteCode = peekPendingInviteCode() ?? undefined;
  const session = await apiFetch<AuthSession>("/oauth/apple/id-token", {
    method: "POST",
    body: JSON.stringify({ idToken, platform, inviteCode }),
  });
  clearPendingInviteCode();
  return session;
}

export async function signInWithOAuth(provider: Provider): Promise<AuthSession> {
  if (provider === "google") {
    return signInWithGoogle();
  }

  const codeVerifier = randomString(64);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const platform = oauthPlatform();
  const redirectUri = defaultRedirectUri();

  const start = await apiFetch<{
    authorizationUrl: string;
    state: string;
    redirectUri?: string;
  }>(`/oauth/${provider}/start`, {
    method: "POST",
    body: JSON.stringify({
      redirectUri,
      codeChallenge,
      platform,
    }),
  });

  const { code, state } = await new Promise<{ code: string; state: string }>(
    (resolve, reject) => {
      let done = false;
      let timeoutId: number | null = null;

      const cleanup = async () => {
        if (timeoutId != null) window.clearTimeout(timeoutId);
        timeoutId = null;
        try {
          const handle = await removePromise;
          await handle.remove();
        } catch {
          // ignore
        }
        try {
          await Browser.close();
        } catch {
          // ignore
        }
      };

      const removePromise = App.addListener("appUrlOpen", (event) => {
        if (done) return;
        try {
          const url = new URL(event.url);
          const code = url.searchParams.get("code");
          const state = url.searchParams.get("state");
          if (code && state) {
            done = true;
            void cleanup().finally(() => resolve({ code, state }));
          }
        } catch {
          // ignore
        }
      });

      timeoutId = window.setTimeout(() => {
        if (done) return;
        done = true;
        void cleanup().finally(() => reject(new Error("OAuth expiré")));
      }, 120_000);

      void Browser.open({ url: start.authorizationUrl }).catch((e) => {
        if (done) return;
        done = true;
        void cleanup().finally(() => reject(e));
      });
    },
  );

  if (state !== start.state) {
    throw new Error("state OAuth incohérent");
  }

  const session = await apiFetch<AuthSession>(`/oauth/${provider}/callback`, {
    method: "POST",
    body: JSON.stringify({
      code,
      redirectUri: start.redirectUri ?? redirectUri,
      codeVerifier,
      state,
      inviteCode: peekPendingInviteCode() ?? undefined,
    }),
  });
  clearPendingInviteCode();
  return session;
}
