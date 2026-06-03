import type {
  GlobalLeagueSummary,
  TopExerciseByLeague,
} from "@one-more/shared/league-aggregate";
import type { LeagueInfo, TierInfo } from "@one-more/shared/strength-standards";

export type { LeagueInfo, TierInfo, RankId, LeagueTier } from "@one-more/shared/strength-standards";
export type { GlobalLeagueSummary, TopExerciseByLeague };

export type LeagueChangeDto = {
  before: LeagueInfo | null;
  after: LeagueInfo | null;
  promoted: boolean;
};

export type HistoryEntryLeagueInsight = {
  isRecord: boolean;
  leagueUp: boolean;
  prevLeague: LeagueInfo | null;
  nextLeague: LeagueInfo | null;
};

export type LeagueSummaryDto = GlobalLeagueSummary & {
  topByLeague: TopExerciseByLeague[];
};
