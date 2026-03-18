import { Capacitor } from "@capacitor/core";
import { AppReview } from "@capawesome/capacitor-app-review";

const STORAGE_KEY = "one-more-app-review";

type ReviewState = {
  firstSeenAtMs: number;
  lastPromptAtMs: number | null;
  promptCount: number;
  positiveMoments: number;
  optedOut: boolean;
};

function nowMs(): number {
  return Date.now();
}

function readState(): ReviewState {
  const fallback: ReviewState = {
    firstSeenAtMs: nowMs(),
    lastPromptAtMs: null,
    promptCount: 0,
    positiveMoments: 0,
    optedOut: false,
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
      lastPromptAtMs:
        typeof parsed.lastPromptAtMs === "number"
          ? parsed.lastPromptAtMs
          : null,
      promptCount:
        typeof parsed.promptCount === "number" ? parsed.promptCount : 0,
      positiveMoments:
        typeof parsed.positiveMoments === "number" ? parsed.positiveMoments : 0,
      optedOut: parsed.optedOut === true,
    };
  } catch {
    return fallback;
  }
}

function writeState(next: ReviewState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function bumpPositiveMoment(): ReviewState {
  const s = readState();
  const next = { ...s, positiveMoments: s.positiveMoments + 1 };
  writeState(next);
  return next;
}

function markPrompted(): void {
  const s = readState();
  writeState({
    ...s,
    lastPromptAtMs: nowMs(),
    promptCount: s.promptCount + 1,
  });
}

export function optOutAppReview(): void {
  const s = readState();
  writeState({ ...s, optedOut: true });
}

export function resetAppReviewState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function canPrompt(state: ReviewState): boolean {
  if (!Capacitor.isNativePlatform()) return false;
  if (state.optedOut) return false;

  const minDaysSinceInstall = 3;
  const minPositiveMoments = 4;
  const minDaysBetweenPrompts = 45;
  const maxPromptsTotal = 2;

  const msSinceInstall = nowMs() - state.firstSeenAtMs;
  if (msSinceInstall < minDaysSinceInstall * 24 * 60 * 60 * 1000) return false;
  if (state.positiveMoments < minPositiveMoments) return false;
  if (state.promptCount >= maxPromptsTotal) return false;

  if (state.lastPromptAtMs != null) {
    const msSinceLast = nowMs() - state.lastPromptAtMs;
    if (msSinceLast < minDaysBetweenPrompts * 24 * 60 * 60 * 1000) return false;
  }

  return true;
}

function getAppleAppId(): string | undefined {
  const id = import.meta.env.VITE_APPLE_APP_ID;
  return typeof id === "string" && id.trim() ? id.trim() : undefined;
}

export async function openStoreListing(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const appId = getAppleAppId();
  if (appId) {
    await AppReview.openAppStore({ appId });
    return;
  }
  await AppReview.openAppStore();
}

export async function maybeRequestAppReview(
  reason: "milestone",
): Promise<boolean> {
  const state = bumpPositiveMoment();
  if (!canPrompt(state)) return false;

  try {
    await AppReview.requestReview();
    markPrompted();
    return true;
  } catch {
    try {
      await openStoreListing();
      markPrompted();
      return true;
    } catch {
      return false;
    }
  }
}
