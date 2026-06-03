import type {
  BrowseLeagueLookups,
  GlobalLeagueSummary,
  TopExerciseByLeague,
} from '../../shared/league-aggregate.js';
import type { LeagueInfo, TierInfo } from '../../shared/strength-standards.js';

export type LeagueInfoDto = LeagueInfo;

export type LeagueSummaryDto = GlobalLeagueSummary & {
  topByLeague: TopExerciseByLeague[];
};

export type LeagueBrowseLookupsDto = BrowseLeagueLookups;

export type LeagueChangeDto = {
  before: LeagueInfoDto | null;
  after: LeagueInfoDto | null;
  promoted: boolean;
};

export type HistoryEntryLeagueInsightDto = {
  isRecord: boolean;
  leagueUp: boolean;
  prevLeague: LeagueInfoDto | null;
  nextLeague: LeagueInfoDto | null;
};

export type PerformanceEntryWithLeagueInsightDto = {
  id: string;
  trackedExerciseId: string;
  date: string;
  weight: number;
  reps: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  leagueInsight: HistoryEntryLeagueInsightDto;
};

export type ExerciseTierLadderDto = {
  tiers: TierInfo[];
};
