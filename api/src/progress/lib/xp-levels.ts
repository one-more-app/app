/** XP cumulé requis pour atteindre le niveau L (L >= 1). Le niveau 1 commence à 0 XP. */
export const XP_LEVEL_BASE = 100;
export const XP_LEVEL_EXPONENT = 1.35;

export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(XP_LEVEL_BASE * Math.pow(level - 1, XP_LEVEL_EXPONENT));
}

/** Niveau actuel dérivé du total XP (minimum 1). */
export function levelFromTotalXp(totalXp: number): number {
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= totalXp) {
    level += 1;
  }
  return level;
}

export type LevelProgress = {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
};

/** Progression dans le niveau actuel vers le suivant. */
export function levelProgressFromTotalXp(totalXp: number): LevelProgress {
  const level = levelFromTotalXp(totalXp);
  const currentThreshold = xpRequiredForLevel(level);
  const nextThreshold = xpRequiredForLevel(level + 1);
  return {
    level,
    xpIntoLevel: totalXp - currentThreshold,
    xpForNextLevel: nextThreshold - currentThreshold,
  };
}
