import { toast } from "sonner";

import { enqueueCelebration } from "@/lib/celebration-queue";
import { UI } from "@/lib/translations";
import type { XpGrantResult } from "@/types";

export type LevelUpCelebrationPayload = {
  previousLevel: number;
  level: number;
  totalXp: number;
};

export function notifyXpGrants(xp: XpGrantResult | undefined): void {
  if (!xp || xp.grants.length === 0) return;

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
    return;
  }

  toast.success(UI.xpGainedToast.replace("{amount}", String(totalGained)), {
    description: UI.xpLevelLabel.replace("{level}", String(xp.level)),
  });
}
