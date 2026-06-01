export type ActivityMonthDto = {
  month: string;
  activeDays: string[];
  activeDayCount: number;
  streak: { current: number; longest: number };
  bounds: { earliestMonth: string; latestMonth: string };
};
