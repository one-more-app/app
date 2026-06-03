export type XpGrantItemDto = {
  sourceType: string;
  amount: number;
};

import type { LeagueChangeDto } from '../../league/dto/league-response.dto.js';

export type XpGrantResultDto = {
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  leveledUp: boolean;
  previousLevel?: number;
  grants: XpGrantItemDto[];
  streak: { current: number; longest: number };
  league?: LeagueChangeDto;
};

export type ProgressStateDto = {
  totalXp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  streak: { current: number; longest: number };
  lastActiveDate: string | null;
  recentGrants: XpGrantItemDto[];
};
