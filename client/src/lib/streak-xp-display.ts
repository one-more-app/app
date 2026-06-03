import { streakXpProgress } from "@one-more/shared/streak-xp-multiplier";

import { resolveProgressStreak } from "@/lib/streak-display";
import type { UserProgressState } from "@/types";

export function resolveStreakXpBonus(progress: UserProgressState | undefined) {
  if (progress?.streakXpBonus) return progress.streakXpBonus;
  const { current } = resolveProgressStreak(progress);
  return streakXpProgress(current);
}
