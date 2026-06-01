import { toast } from "sonner";

import { enqueueCelebration } from "@/lib/celebration-queue";
import { UI } from "@/lib/translations";
import type { XpGrantResult } from "@/types";

export type LevelUpCelebrationPayload = {
  previousLevel: number;
  level: number;
  totalXp: number;
};

export type StreakCelebrationPayload = {
  current: number;
  previousStreak: number;
  longest: number;
  xpGained?: number;
  level: number;
};

function hasDailyStreakGrant(xp: XpGrantResult): boolean {
  return xp.grants.some((g) => g.sourceType === "daily_streak");
}

export function notifyStreakCelebration(xp: XpGrantResult | undefined): void {
  if (!xp || !hasDailyStreakGrant(xp)) return;

  const xpGained = xp.grants
    .filter((g) => g.sourceType === "daily_streak")
    .reduce((s, g) => s + g.amount, 0);

  const current = xp.streak.current;
  const previousStreak = current <= 1 ? 0 : current - 1;

  enqueueCelebration({
    kind: "streak",
    payload: {
      current,
      previousStreak,
      longest: xp.streak.longest,
      xpGained: xpGained > 0 ? xpGained : undefined,
      level: xp.level,
    },
  });
}

export function notifyXpGrants(xp: XpGrantResult | undefined): void {
  if (!xp || xp.grants.length === 0) return;

  const dailyStreak = hasDailyStreakGrant(xp);

  const totalGained = xp.grants.reduce((s, g) => s + g.amount, 0);
  if (totalGained <= 0) return;

  if (xp.leveledUp && xp.previousLevel != null) {
    enqueueCelebration({
      kind: "levelup",
      payload: {
        previousLevel: xp.previousLevel,
        level: xp.level,
        totalXp: xp.totalXp,
      },
    });
    if (dailyStreak) notifyStreakCelebration(xp);
    return;
  }

  if (dailyStreak) {
    notifyStreakCelebration(xp);
    return;
  }

  toast.success(UI.xpGainedToast.replace("{amount}", String(totalGained)), {
    description: UI.xpLevelLabel.replace("{level}", String(xp.level)),
  });
}
