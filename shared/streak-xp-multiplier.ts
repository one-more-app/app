export const STREAK_XP_BONUS = {
  minStreakDays: 1,
  percentPerDay: 5,
  maxBonusPercent: 500,
} as const;

export type StreakXpProgress = {
  bonusPercent: number;
  multiplier: number;
  daysToMax: number;
  isMax: boolean;
  progressToMax: number;
};

/** Jours de série pour atteindre le bonus max (+500 % → ×6). */
export function streakXpMaxStreakDays(): number {
  return STREAK_XP_BONUS.maxBonusPercent / STREAK_XP_BONUS.percentPerDay;
}

export function streakXpBonusPercent(streakDays: number): number {
  if (streakDays < STREAK_XP_BONUS.minStreakDays) return 0;
  const raw = streakDays * STREAK_XP_BONUS.percentPerDay;
  return Math.min(raw, STREAK_XP_BONUS.maxBonusPercent);
}

export function streakXpMultiplier(streakDays: number): number {
  return 1 + streakXpBonusPercent(streakDays) / 100;
}

export function applyStreakXpMultiplier(
  baseAmount: number,
  streakDays: number,
): number {
  if (baseAmount <= 0) return 0;
  return Math.floor(baseAmount * streakXpMultiplier(streakDays));
}

export function streakXpProgress(streakDays: number): StreakXpProgress {
  const bonusPercent = streakXpBonusPercent(streakDays);
  const isMax = bonusPercent >= STREAK_XP_BONUS.maxBonusPercent;
  const daysToMax = isMax
    ? 0
    : Math.max(0, Math.ceil(streakXpMaxStreakDays() - streakDays));
  const progressToMax =
    STREAK_XP_BONUS.maxBonusPercent > 0
      ? Math.min(
          100,
          Math.round(
            (bonusPercent / STREAK_XP_BONUS.maxBonusPercent) * 100,
          ),
        )
      : 0;

  return {
    bonusPercent,
    multiplier: streakXpMultiplier(streakDays),
    daysToMax,
    isMax,
    progressToMax,
  };
}

export function formatStreakXpBonus(streakDays: number): string | null {
  const pct = streakXpBonusPercent(streakDays);
  if (pct <= 0) return null;
  return `+${pct}% XP`;
}
