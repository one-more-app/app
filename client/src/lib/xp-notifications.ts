import { XP_AMOUNTS } from "@one-more/shared/xp-config";
import { toast } from "sonner";

import { enqueueCelebration } from "@/lib/celebration-queue";
import { UI } from "@/lib/translations";
import type { XpGrantResult } from "@/types";

function actionGrantBaseAmount(sourceType: string): number {
  switch (sourceType) {
    case "perf":
      return XP_AMOUNTS.perf;
    case "personal_record":
      return XP_AMOUNTS.personalRecord;
    default:
      return 0;
  }
}

function streakBonusXpFromGrants(xp: XpGrantResult): number {
  return xp.grants.reduce((sum, grant) => {
    const base = actionGrantBaseAmount(grant.sourceType);
    if (base <= 0) return sum;
    return sum + Math.max(0, grant.amount - base);
  }, 0);
}

function xpToastDescription(xp: XpGrantResult): string {
  const levelLine = UI.xpLevelLabel.replace("{level}", String(xp.level));
  const bonusXp = streakBonusXpFromGrants(xp);
  const bonusPercent = xp.streakXpBonus?.bonusPercent ?? 0;
  if (bonusXp <= 0 || bonusPercent <= 0) return levelLine;
  return `${UI.xpGainedBonusDescription
    .replace("{bonus}", String(bonusXp))
    .replace("{percent}", String(bonusPercent))} · ${levelLine}`;
}

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
    description: xpToastDescription(xp),
  });
}
