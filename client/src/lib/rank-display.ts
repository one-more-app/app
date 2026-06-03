import { rankToTier } from "@/lib/muscle-league-stats";
import {
  formatRankLabel,
  parseRankId,
  type LeagueTier,
  type RankId,
} from "@/lib/strength-standards";

export function rankIdLabel(rankId: RankId): string {
  const { tier, subRank } = parseRankId(rankId);
  return formatRankLabel(tier, subRank);
}

export function rankIdTier(rankId: RankId): LeagueTier {
  return rankToTier(rankId);
}
