import type { UserProgressState, XpGrantResult } from "@/types";

const DEFAULT_PROGRESS: UserProgressState = {
  totalXp: 0,
  level: 1,
  xpIntoLevel: 0,
  xpForNextLevel: 100,
  streak: { current: 0, longest: 0 },
  recentGrants: [],
};

let progressCache: UserProgressState = { ...DEFAULT_PROGRESS };

export function getUserProgress(): UserProgressState {
  return progressCache;
}

function notifyProgressChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("one-more:local-data-changed", {
      detail: { kind: "progress", at: Date.now() },
    }),
  );
}

export function setUserProgress(state: UserProgressState): void {
  progressCache = state;
  notifyProgressChanged();
}

export function applyXpGrantResult(xp: XpGrantResult): void {
  progressCache = {
    totalXp: xp.totalXp,
    level: xp.level,
    xpIntoLevel: xp.xpIntoLevel,
    xpForNextLevel: xp.xpForNextLevel,
    streak: xp.streak,
    streakXpBonus: xp.streakXpBonus,
    recentGrants: xp.grants,
  };
  notifyProgressChanged();
}
