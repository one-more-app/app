export type XpGrantItemDto = {
  sourceType: string;
  amount: number;
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
