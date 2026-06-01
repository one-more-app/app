import { applyStreakExpiry } from "@one-more/shared/streak-dates";
import type { UserProgressState } from "@/types";

export function resolveStreak(
  streak: { current: number; longest: number },
  lastActiveDate?: string | null,
): { current: number; longest: number } {
  const current =
    lastActiveDate != null
      ? applyStreakExpiry(lastActiveDate, streak.current)
      : streak.current;
  return { current, longest: streak.longest };
}

export function resolveProgressStreak(
  progress: UserProgressState | undefined,
): { current: number; longest: number } {
  if (!progress) return { current: 0, longest: 0 };
  return resolveStreak(progress.streak, progress.lastActiveDate);
}
