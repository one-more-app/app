import { apiFetch } from "@/lib/api";
import type { AuthSession } from "@/lib/auth";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";

type Provider = "google" | "apple";

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
  // IMPORTANT: nécessite de configurer deep links côté iOS/Android.
  // MVP: on utilise un custom scheme.
  return "com.onemore.app://oauth";
}

export async function signInWithOAuth(provider: Provider): Promise<AuthSession> {
  const codeVerifier = randomString(64);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const redirectUri = defaultRedirectUri();

  const start = await apiFetch<{ authorizationUrl: string; state: string }>(
    `/oauth/${provider}/start`,
    {
      method: "POST",
      body: JSON.stringify({ redirectUri, codeChallenge }),
    },
  );

  const code = await new Promise<string>((resolve, reject) => {
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
        if (code) {
          done = true;
          void cleanup().finally(() => resolve(code));
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
  });

  const session = await apiFetch<AuthSession>(`/oauth/${provider}/callback`, {
    method: "POST",
    body: JSON.stringify({ code, redirectUri, codeVerifier }),
  });
  return session;
}

