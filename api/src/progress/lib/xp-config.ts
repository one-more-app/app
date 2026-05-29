export const XP_AMOUNTS = {
  perf: 15,
  personalRecord: 40,
  leaguePromotion: 80,
  dailyStreakBase: 25,
  dailyStreakPerDay: 5,
  dailyStreakCap: 14,
} as const;

export const XP_DAILY_CAPS = {
  perf: 30,
  personalRecordPerExercise: 1,
  leaguePromotion: 3,
  dailyStreak: 1,
} as const;

export type XpSourceType =
  | 'perf'
  | 'personal_record'
  | 'league_promotion'
  | 'daily_streak';
