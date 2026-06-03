/** Types et helpers ligue — calcul côté API ; réexport des types partagés. */
export type {
  BrowseLeagueLookups,
  GlobalLeagueSummary,
  MuscleExerciseLeagueRow,
  MuscleLeagueAgg,
  TopExerciseByLeague,
  ZoneLeagueAgg,
} from "@one-more/shared/league-aggregate";

export { browseEquipmentLeagueKey } from "@one-more/shared/league-aggregate";

import type { BrowseLeagueLookups } from "@one-more/shared/league-aggregate";
import type { LeagueTier, RankId } from "@/lib/strength-standards";

/** Convertit la réponse API (Records) en Maps pour le parcours catalogue. */
export function browseLookupsToMaps(lookups: BrowseLeagueLookups): {
  byZone: Map<string, RankId>;
  targetInZone: Map<string, Map<string, RankId>>;
  equipmentInPath: Map<string, RankId>;
} {
  const targetInZone = new Map<string, Map<string, RankId>>();
  for (const [zone, targets] of Object.entries(lookups.targetInZone)) {
    targetInZone.set(zone, new Map(Object.entries(targets)));
  }
  return {
    byZone: new Map(Object.entries(lookups.byZone)),
    targetInZone,
    equipmentInPath: new Map(Object.entries(lookups.equipmentInPath)),
  };
}

/** Palier principal pour affichage carte muscle (sous-rangs regroupés par couleur). */
export function rankToTier(rankId: RankId): LeagueTier {
  if (rankId === "legend") return "legend";
  return rankId.split("_")[0] as LeagueTier;
}
