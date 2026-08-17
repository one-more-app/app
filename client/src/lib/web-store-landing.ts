import {
  buildOneLinkDownloadUrl,
  buildOneLinkInviteUrl,
} from "@/lib/appsflyer-config";

declare global {
  interface Window {
    __ONE_MORE_E2E__?: boolean;
    __ONE_MORE_FORCE_STORE_LANDING__?: boolean;
  }
}

export type WebStoreLandingDecisionInput = {
  isNative: boolean;
  isDev: boolean;
  isEventRoute: boolean;
  isE2e: boolean;
  forceStoreLanding: boolean;
};

export function isWebStoreEventRoute(pathname: string): boolean {
  return pathname.startsWith("/event/");
}

export function readWebStoreLandingRuntimeFlags(): {
  isE2e: boolean;
  forceStoreLanding: boolean;
} {
  if (typeof window === "undefined") {
    return { isE2e: false, forceStoreLanding: false };
  }
  return {
    isE2e: window.__ONE_MORE_E2E__ === true || Boolean(navigator.webdriver),
    forceStoreLanding: window.__ONE_MORE_FORCE_STORE_LANDING__ === true,
  };
}

/** Landing store web prod. Natif, /event/*, vite dev et e2e restent sur l’app. */
export function shouldShowWebStoreLanding(
  input: WebStoreLandingDecisionInput,
): boolean {
  if (input.isNative) return false;
  if (input.isEventRoute) return false;
  if (input.forceStoreLanding) return true;
  if (input.isDev) return false;
  if (input.isE2e) return false;
  return true;
}

export function resolveWebStoreLandingOneLink(pathname: string): string {
  const match = pathname.match(/^\/invite\/([^/]+)/);
  const inviteCode = match?.[1];
  if (inviteCode) {
    return buildOneLinkInviteUrl(inviteCode) ?? buildOneLinkDownloadUrl();
  }
  return buildOneLinkDownloadUrl();
}
