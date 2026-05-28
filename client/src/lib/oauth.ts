import { apiFetch } from "@/lib/api";
import type { AuthSession } from "@/lib/auth";
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
  return "com.onemore.app:/oauth";
}

function oauthPlatform(): Platform {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") return "ios";
  if (platform === "android") return "android";
  throw new Error("OAuth mobile disponible uniquement sur iOS et Android");
}

export async function signInWithOAuth(provider: Provider): Promise<AuthSession> {
  const codeVerifier = randomString(64);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const platform = oauthPlatform();

  const start = await apiFetch<{
    authorizationUrl: string;
    state: string;
    redirectUri?: string;
  }>(`/oauth/${provider}/start`, {
    method: "POST",
    body: JSON.stringify({
      redirectUri: provider === "apple" ? defaultRedirectUri() : undefined,
      codeChallenge,
      platform,
    }),
  });

  const redirectUri = start.redirectUri ?? defaultRedirectUri();
  // #region agent log
  fetch('http://127.0.0.1:7833/ingest/13ae7a14-0ef6-4bc8-909d-3672502a0001',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f3f17e'},body:JSON.stringify({sessionId:'f3f17e',runId:'post-fix',hypothesisId:'H1',location:'oauth.ts:start',message:'oauth start response',data:{platform,redirectUri},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

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
          // #region agent log
          fetch('http://127.0.0.1:7833/ingest/13ae7a14-0ef6-4bc8-909d-3672502a0001',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f3f17e'},body:JSON.stringify({sessionId:'f3f17e',runId:'post-fix',hypothesisId:'H1',location:'oauth.ts:appUrlOpen',message:'deep link received',data:{urlPrefix:event.url.slice(0,80),hasCode:!!code,hasState:!!state},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
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
    body: JSON.stringify({ code, redirectUri, codeVerifier, state }),
  });
  return session;
}
