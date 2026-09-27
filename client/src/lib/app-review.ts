import { Capacitor } from "@capacitor/core";
import { AppReview } from "@capawesome/capacitor-app-review";
import type { ReviewLastAnswer } from "@/lib/review-eligibility";
import { canRequestNativeReviewOnRecap } from "@/lib/review-eligibility";

const STORAGE_KEY = "one-more-app-review";
const ANDROID_PACKAGE = "com.one_more.app";

export type ReviewTitleVariant = "a" | "b" | "c";

type ReviewState = {
  firstSeenAtMs: number;
  lastShownAtMs: number | null;
  shownAtMs: number[];
  lastAnswer: ReviewLastAnswer | null;
  storeOpenedAtMs: number | null;
  sessionCardPending: boolean;
  titleVariant: ReviewTitleVariant | null;
  pulseShownSessionDate: string | null;
  /** Legacy fields (migration) */
  lastPromptAtMs?: number | null;
  promptCount?: number;
  positiveMoments?: number;
  optedOut?: boolean;
};

function nowMs(): number {
  return Date.now();
}

function readState(): ReviewState {
  const fallback: ReviewState = {
    firstSeenAtMs: nowMs(),
    lastShownAtMs: null,
    shownAtMs: [],
    lastAnswer: null,
    storeOpenedAtMs: null,
    sessionCardPending: false,
    titleVariant: null,
    pulseShownSessionDate: null,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ReviewState>;
    return {
      firstSeenAtMs:
        typeof parsed.firstSeenAtMs === "number"
          ? parsed.firstSeenAtMs
          : fallback.firstSeenAtMs,
      lastShownAtMs:
        typeof parsed.lastShownAtMs === "number"
          ? parsed.lastShownAtMs
          : typeof parsed.lastPromptAtMs === "number"
            ? parsed.lastPromptAtMs
            : null,
      shownAtMs: Array.isArray(parsed.shownAtMs)
        ? parsed.shownAtMs.filter((t): t is number => typeof t === "number")
        : [],
      lastAnswer:
        parsed.lastAnswer === "yes" ||
        parsed.lastAnswer === "no" ||
        parsed.lastAnswer === "dismissed" ||
        parsed.lastAnswer === "rest_over"
          ? parsed.lastAnswer
          : null,
      storeOpenedAtMs:
        typeof parsed.storeOpenedAtMs === "number"
          ? parsed.storeOpenedAtMs
          : null,
      sessionCardPending: parsed.sessionCardPending === true,
      titleVariant:
        parsed.titleVariant === "a" ||
        parsed.titleVariant === "b" ||
        parsed.titleVariant === "c"
          ? parsed.titleVariant
          : null,
      pulseShownSessionDate:
        typeof parsed.pulseShownSessionDate === "string"
          ? parsed.pulseShownSessionDate
          : null,
    };
  } catch {
    return fallback;
  }
}

function writeState(next: ReviewState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getReviewStateSnapshot(): ReviewState {
  return readState();
}

export function resetAppReviewState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** @deprecated Conservé pour Réglages si besoin ; le parcours pulse n'utilise plus optOut. */
export function optOutAppReview(): void {
  const s = readState();
  writeState({ ...s, storeOpenedAtMs: nowMs() });
}

function pickTitleVariant(): ReviewTitleVariant {
  const roll = Math.random();
  if (roll < 1 / 3) return "a";
  if (roll < 2 / 3) return "b";
  return "c";
}

export function getOrAssignReviewTitleVariant(): ReviewTitleVariant {
  const s = readState();
  if (s.titleVariant) return s.titleVariant;
  const variant = pickTitleVariant();
  writeState({ ...s, titleVariant: variant });
  return variant;
}

export function markReviewPulseShown(sessionDateKey: string): void {
  const s = readState();
  const t = nowMs();
  writeState({
    ...s,
    lastShownAtMs: t,
    shownAtMs: [...s.shownAtMs, t],
    pulseShownSessionDate: sessionDateKey,
  });
}

export function markReviewPulseAnswer(answer: ReviewLastAnswer): void {
  const s = readState();
  writeState({ ...s, lastAnswer: answer, lastShownAtMs: nowMs() });
}

export function markReviewStoreOpened(): void {
  const s = readState();
  writeState({ ...s, storeOpenedAtMs: nowMs() });
}

export function setReviewSessionCardPending(pending: boolean): void {
  const s = readState();
  writeState({ ...s, sessionCardPending: pending });
}

export function isReviewSessionCardPending(): boolean {
  return readState().sessionCardPending;
}

function getAppleAppId(): string | undefined {
  const id = import.meta.env.VITE_APPLE_APP_ID;
  return typeof id === "string" && id.trim() ? id.trim() : undefined;
}

export function getStoreReviewUrl(): string {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") {
    const appId = getAppleAppId();
    if (appId) {
      return `https://apps.apple.com/app/id${appId}?action=write-review`;
    }
    return "https://apps.apple.com/app/id000000000?action=write-review";
  }
  if (platform === "android") {
    return `market://details?id=${ANDROID_PACKAGE}`;
  }
  return `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
}

export function getStoreReviewWebFallbackUrl(): string {
  return `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
}

const REVIEW_REQUEST_TIMEOUT_MS = 12_000;

/**
 * Modale avis native (Capacitor). Jamais de fiche store.
 * iOS/Android peuvent ne rien afficher (quota, déjà noté) : l’appel part quand même.
 */
export async function requestNativeAppReview(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("native-only");
  }

  const reviewCall = AppReview.requestReview();
  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(
      () => reject(new Error("review-request-timeout")),
      REVIEW_REQUEST_TIMEOUT_MS,
    );
  });

  await Promise.race([reviewCall, timeout]);
}

/** Parcours review pulse / carte séance (cooldown store pulse). */
export async function openStoreReviewListing(): Promise<void> {
  await requestNativeAppReview();
  markReviewStoreOpened();
}

/** Réglages · Noter l'app (sans cooldown pulse, rappelable à chaque tap). */
export async function openStoreListing(): Promise<void> {
  await requestNativeAppReview();
}

export async function maybeRequestNativeReviewOnRecap(input: {
  sessionIsLive: boolean;
  hasPrInSession: boolean;
  todayDateKey: string;
}): Promise<boolean> {
  const state = readState();
  if (
    !canRequestNativeReviewOnRecap({
      isNativePlatform: Capacitor.isNativePlatform(),
      sessionIsLive: input.sessionIsLive,
      hasPrInSession: input.hasPrInSession,
      pulseShownSessionDate: state.pulseShownSessionDate,
      todayDateKey: input.todayDateKey,
    })
  ) {
    return false;
  }

  try {
    await AppReview.requestReview();
    return true;
  } catch {
    return false;
  }
}
