export type XpGrantItemDto = {
  sourceType: string;
  amount: number;
};

import type { LeagueChangeDto } from '../../league/dto/league-response.dto.js';

export type StreakXpBonusDto = {
  bonusPercent: number;
  multiplier: number;
  daysToMax: number;
  isMax: boolean;
  progressToMax: number;
};

export type XpGrantResultDto = {
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  leveledUp: boolean;
  previousLevel?: number;
  grants: XpGrantItemDto[];
  streak: { current: number; longest: number };
  streakXpBonus: StreakXpBonusDto;
  league?: LeagueChangeDto;
};

export type ProgressStateDto = {
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  streak: { current: number; longest: number };
  streakXpBonus: StreakXpBonusDto;
  lastActiveDate: string | null;
  recentGrants: XpGrantItemDto[];
};
