/**
 * Système de ligues : ratio 1RM / poids du corps.
 * Chaque combinaison (equipment, target) a ses ratios précis.
 * Référence : van den Hoek et al. (2024) - 809k compétitions powerlifting raw,
 * ExRx.net, Symmetric Strength.
 */

export type LeagueTier =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "legend";

export type RankId =
  | "bronze_1"
  | "bronze_2"
  | "bronze_3"
  | "silver_1"
  | "silver_2"
  | "silver_3"
  | "gold_1"
  | "gold_2"
  | "gold_3"
  | "platinum_1"
  | "platinum_2"
  | "platinum_3"
  | "diamond_1"
  | "diamond_2"
  | "diamond_3"
  | "legend";

/** @deprecated Utiliser `LeagueTier` ou `RankId`. */
export type LeagueLevel = LeagueTier;

export const RANK_ORDER: readonly RankId[] = [
  "bronze_1",
  "bronze_2",
  "bronze_3",
  "silver_1",
  "silver_2",
  "silver_3",
  "gold_1",
  "gold_2",
  "gold_3",
  "platinum_1",
  "platinum_2",
  "platinum_3",
  "diamond_1",
  "diamond_2",
  "diamond_3",
  "legend",
] as const;

/** @deprecated Utiliser `RANK_ORDER`. */
export const LEAGUE_ORDER: readonly RankId[] = RANK_ORDER;

const TIER_FR_LABELS: Record<LeagueTier, string> = {
  bronze: "Bronze",
  silver: "Argent",
  gold: "Or",
  platinum: "Platine",
  diamond: "Diamant",
  legend: "Légende",
};

export interface LeagueInfo {
  rankId: RankId;
  tier: LeagueTier;
  subRank: 1 | 2 | 3 | null;
  label: string;
  tierLabel: string;
  oneRM: number;
  weightTierStart: number;
  weightTierEnd: number | null;
  ratioMin: number;
  ratioNext: number;
  weightToReach: number;
  progressToNext: number;
  percentileEstimate: number;
  /** Prochain rang (null si déjà Légende). */
  nextRankId: RankId | null;
}

type RatioTier = { ratio: number; label: string; rankId: RankId };

const LEGACY_TIER_LABELS = [
  "Fer",
  "Bronze",
  "Argent",
  "Or",
  "Platine",
  "Émeraude",
  "Diamant",
  "Maître",
  "Elite",
  "Légende",
] as const;

/** Indices des 10 paliers historiques pour les bornes des 6 paliers principaux. */
const LEGACY_ANCHOR_INDICES = [0, 2, 3, 4, 6, 9] as const;

const MAIN_TIERS: readonly LeagueTier[] = [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "legend",
] as const;

export function parseRankId(rankId: RankId): {
  tier: LeagueTier;
  subRank: 1 | 2 | 3 | null;
} {
  if (rankId === "legend") return { tier: "legend", subRank: null };
  const [tier, sub] = rankId.split("_") as [LeagueTier, string];
  return { tier, subRank: Number(sub) as 1 | 2 | 3 };
}

export function formatRankLabel(tier: LeagueTier, subRank: 1 | 2 | 3 | null): string {
  if (tier === "legend") return TIER_FR_LABELS.legend;
  return `${TIER_FR_LABELS[tier]} ${subRank}`;
}

export function getRankIndex(rankId: RankId): number {
  const i = RANK_ORDER.indexOf(rankId);
  return i === -1 ? 0 : i;
}

/** @deprecated Utiliser `getRankIndex`. */
export function getLeagueLevelIndex(rankId: RankId): number {
  return getRankIndex(rankId);
}

export function getNextRankId(rankId: RankId): RankId | null {
  const i = getRankIndex(rankId);
  if (i >= RANK_ORDER.length - 1) return null;
  return RANK_ORDER[i + 1]!;
}

/** Libellé français du palier principal (Bronze, Argent, …). */
export function leagueTierToFrenchLabel(tier: LeagueTier): string {
  return TIER_FR_LABELS[tier] ?? tier;
}

/** @deprecated Utiliser `leagueTierToFrenchLabel(parseRankId(rankId).tier)`. */
export function leagueLevelToFrenchLabel(tier: LeagueTier): string {
  return leagueTierToFrenchLabel(tier);
}

export function rankScore(league: LeagueInfo): number {
  return getRankIndex(league.rankId) + league.progressToNext;
}

/** Médiane d’une liste de scores rang (indice 0–15 + progression). */
export function medianRankScore(scores: readonly number[]): number {
  if (scores.length === 0) return 0;
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

/** @deprecated Utiliser `medianRankScore`. */
export function medianLeagueScore(scores: readonly number[]): number {
  return medianRankScore(scores);
}

export function rankScoreToRepresentativeRank(score: number): RankId {
  const idx = Math.min(
    RANK_ORDER.length - 1,
    Math.max(0, Math.floor(score)),
  );
  return RANK_ORDER[idx]!;
}

/** @deprecated Utiliser `rankScoreToRepresentativeRank`. */
export function leagueScoreToRepresentativeLevel(score: number): RankId {
  return rankScoreToRepresentativeRank(score);
}

/** @deprecated Utiliser `rankScoreToRepresentativeRank`. */
export function averageLeagueScoreToLevel(score: number): RankId {
  return rankScoreToRepresentativeRank(score);
}

export function getGlobalLeagueGauge(score: number): {
  fromRank: RankId;
  toRank: RankId | null;
  progress: number;
  segmentStartScore: number;
  segmentEndScore: number | null;
} {
  const maxScore = RANK_ORDER.length - 0.001;
  const s = Math.max(0, Math.min(maxScore, score));
  const i = Math.min(RANK_ORDER.length - 1, Math.floor(s));
  const fromRank = RANK_ORDER[i]!;
  if (i >= RANK_ORDER.length - 1) {
    return {
      fromRank,
      toRank: null,
      progress: 1,
      segmentStartScore: i,
      segmentEndScore: null,
    };
  }
  const toRank = RANK_ORDER[i + 1]!;
  const progress = Math.min(1, Math.max(0, s - i));
  return {
    fromRank,
    toRank,
    progress,
    segmentStartScore: i,
    segmentEndScore: i + 1,
  };
}

/** Percentile estimé selon l’index de rang (0–15). */
function percentileForRankIndex(rankIndex: number, progressToNext: number): number {
  const maxIdx = RANK_ORDER.length - 1;
  const segment = 99 / maxIdx;
  const base = rankIndex * segment;
  return Math.round(base + progressToNext * segment);
}

/** Transforme 10 paliers historiques en 16 rangs (5×3 sous-rangs + Légende). */
export function expandLegacyTiersToRankTiers(
  legacyTiers: readonly { ratio: number; label: string }[],
): RatioTier[] {
  if (legacyTiers.length < 10) {
    return legacyTiers.map((t, i) => ({
      ...t,
      rankId: RANK_ORDER[Math.min(i, RANK_ORDER.length - 1)]!,
    }));
  }

  const anchorRatios = LEGACY_ANCHOR_INDICES.map(
    (i) => legacyTiers[i]!.ratio,
  );
  const out: RatioTier[] = [];

  for (let main = 0; main < MAIN_TIERS.length - 1; main++) {
    const tier = MAIN_TIERS[main]!;
    const start = anchorRatios[main]!;
    const end = anchorRatios[main + 1]!;
    const span = end - start;
    for (let sub = 1; sub <= 3; sub++) {
      const rankId = `${tier}_${sub}` as RankId;
      const ratio =
        sub === 1 ? start : start + (span * (sub - 1)) / 3;
      out.push({
        ratio: Math.round(ratio * 10000) / 10000,
        label: formatRankLabel(tier, sub as 1 | 2 | 3),
        rankId,
      });
    }
  }

  out.push({
    ratio: anchorRatios[5]!,
    label: formatRankLabel("legend", null),
    rankId: "legend",
  });

  return out;
}

/** Crée les paliers historiques (10 ratios) en base de données. */
function tiers(ratios: number[], labels = LEGACY_TIER_LABELS): Omit<RatioTier, "rankId">[] {
  return ratios.map((r, i) => ({
    ratio: r,
    label: labels[i] ?? String(i),
  }));
}

function expandStandardsEntry(entry: {
  male: Omit<RatioTier, "rankId">[];
  female: Omit<RatioTier, "rankId">[];
}): StandardsEntry {
  const toRankTiers = (legacy: Omit<RatioTier, "rankId">[]) =>
    expandLegacyTiersToRankTiers(
      legacy.map((t) => ({ ...t, rankId: "bronze_1" as RankId })),
    );
  return {
    male: toRankTiers(entry.male),
    female: toRankTiers(entry.female),
  };
}

// Standards par (equipment, target) – ratios précis pour chaque combinaison
// Clé: "equipment_target" ou "equipment_target_variant"
type LegacyStandardsEntry = Record<
  "male" | "female",
  Omit<RatioTier, "rankId">[]
>;
type StandardsEntry = Record<"male" | "female", RatioTier[]>;

const STANDARDS_BY_EQUIPMENT_TARGET: Record<string, LegacyStandardsEntry> = {
  // --- PECTORAUX (van den Hoek 2024: Legend M 1.95×, F 1.35×, ratio F/H 69%) ---
  barbell_pectorals: {
    male: tiers([0, 0.22, 0.43, 0.65, 0.87, 1.08, 1.3, 1.52, 1.73, 1.95]),
    female: tiers([0, 0.15, 0.3, 0.45, 0.6, 0.74, 0.9, 1.05, 1.2, 1.35]),
  },
  dumbbell_pectorals: {
    male: tiers([0, 0.08, 0.16, 0.25, 0.33, 0.41, 0.49, 0.58, 0.66, 0.74]),
    female: tiers([0, 0.06, 0.11, 0.17, 0.23, 0.28, 0.34, 0.4, 0.45, 0.51]),
  },
  cable_pectorals: {
    male: tiers([0, 0.21, 0.41, 0.62, 0.82, 1.03, 1.23, 1.44, 1.64, 1.85]),
    female: tiers([0, 0.14, 0.29, 0.43, 0.57, 0.71, 0.86, 1, 1.14, 1.28]),
  },
  machine_pectorals: {
    male: tiers([0, 0.22, 0.43, 0.65, 0.87, 1.08, 1.3, 1.52, 1.73, 1.95]),
    female: tiers([0, 0.15, 0.3, 0.45, 0.6, 0.74, 0.9, 1.05, 1.2, 1.35]),
  },
  // Incliné ~12% moins que flat bench
  barbell_pectorals_incline: {
    male: tiers([0, 0.19, 0.38, 0.57, 0.77, 0.95, 1.14, 1.34, 1.52, 1.72]),
    female: tiers([0, 0.13, 0.26, 0.4, 0.53, 0.65, 0.79, 0.92, 1.06, 1.19]),
  },
  dumbbell_pectorals_incline: {
    male: tiers([0, 0.07, 0.14, 0.22, 0.29, 0.36, 0.43, 0.51, 0.58, 0.65]),
    female: tiers([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45]),
  },

  // --- DOS / ROW ---
  barbell_upper_back: {
    male: tiers([0, 0.13, 0.27, 0.4, 0.53, 0.67, 0.8, 0.93, 1.07, 1.2]),
    female: tiers([0, 0.1, 0.2, 0.31, 0.41, 0.51, 0.61, 0.72, 0.82, 0.92]),
  },
  barbell_lats: {
    male: tiers([0, 0.13, 0.27, 0.4, 0.53, 0.67, 0.8, 0.93, 1.07, 1.2]),
    female: tiers([0, 0.1, 0.2, 0.31, 0.41, 0.51, 0.61, 0.72, 0.82, 0.92]),
  },
  dumbbell_upper_back: {
    male: tiers([0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84, 0.9, 0.96]),
    female: tiers([0, 0.09, 0.17, 0.26, 0.34, 0.43, 0.51, 0.6, 0.64, 0.69]),
  },
  cable_upper_back: {
    male: tiers([0, 0.12, 0.25, 0.37, 0.5, 0.62, 0.75, 0.87, 1, 1.12]),
    female: tiers([0, 0.09, 0.18, 0.28, 0.37, 0.46, 0.55, 0.65, 0.74, 0.83]),
  },
  cable_lats: {
    male: tiers([0, 0.12, 0.25, 0.37, 0.5, 0.62, 0.75, 0.87, 1, 1.12]),
    female: tiers([0, 0.09, 0.18, 0.28, 0.37, 0.46, 0.55, 0.65, 0.74, 0.83]),
  },
  machine_upper_back: {
    male: tiers([0, 0.12, 0.26, 0.38, 0.5, 0.63, 0.75, 0.88, 1.01, 1.13]),
    female: tiers([0, 0.09, 0.19, 0.29, 0.39, 0.48, 0.58, 0.68, 0.77, 0.87]),
  },

  // --- EPAULES / OVERHEAD (Lean FFMI: Beginner 0.4×, Novice 0.55×, Inter 0.75×, Advanced 1.0×, Elite 1.25×) ---
  barbell_delts: {
    male: tiers([0, 0.14, 0.28, 0.42, 0.56, 0.7, 0.84, 0.98, 1.12, 1.25]),
    female: tiers([0, 0.11, 0.21, 0.32, 0.43, 0.53, 0.64, 0.74, 0.85, 0.95]),
  },
  dumbbell_delts: {
    male: tiers([0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.54, 0.63, 0.72, 0.81]),
    female: tiers([0, 0.07, 0.14, 0.21, 0.28, 0.34, 0.41, 0.48, 0.55, 0.62]),
  },
  cable_delts: {
    male: tiers([0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84, 0.96, 1.08]),
    female: tiers([0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.54, 0.63, 0.72, 0.81]),
  },
  machine_delts: {
    male: tiers([0, 0.14, 0.28, 0.42, 0.56, 0.7, 0.84, 0.98, 1.12, 1.25]),
    female: tiers([0, 0.11, 0.21, 0.32, 0.43, 0.53, 0.64, 0.74, 0.85, 0.95]),
  },

  // --- QUADS / SQUAT (van den Hoek 2024: Legend M 2.83×, F 2.26×, ratio F/H 80%) ---
  barbell_quads: {
    male: tiers([0, 0.31, 0.63, 0.94, 1.26, 1.57, 1.88, 2.2, 2.51, 2.83]),
    female: tiers([0, 0.25, 0.5, 0.75, 1.01, 1.26, 1.51, 1.76, 2.01, 2.26]),
  },
  barbell_glutes: {
    male: tiers([0, 0.31, 0.63, 0.94, 1.26, 1.57, 1.88, 2.2, 2.51, 2.83]),
    female: tiers([0, 0.25, 0.5, 0.75, 1.01, 1.26, 1.51, 1.76, 2.01, 2.26]),
  },
  dumbbell_quads: {
    male: tiers([0, 0.08, 0.17, 0.25, 0.34, 0.42, 0.51, 0.59, 0.68, 0.76]),
    female: tiers([0, 0.07, 0.13, 0.2, 0.27, 0.34, 0.41, 0.47, 0.54, 0.61]),
  },
  lever_quads: {
    male: tiers([0, 0.31, 0.63, 0.94, 1.26, 1.57, 1.88, 2.2, 2.51, 2.83]),
    female: tiers([0, 0.25, 0.5, 0.75, 1.01, 1.26, 1.51, 1.76, 2.01, 2.26]),
  },
  barbell_quads_hack: {
    male: tiers([0, 0.27, 0.54, 0.8, 1.07, 1.34, 1.6, 1.87, 2.14, 2.4]),
    female: tiers([0, 0.21, 0.43, 0.64, 0.86, 1.07, 1.28, 1.5, 1.71, 1.92]),
  },
  dumbbell_quads_bulgarian: {
    male: tiers([0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.36, 0.42, 0.48, 0.54]),
    female: tiers([0, 0.05, 0.09, 0.14, 0.19, 0.24, 0.29, 0.34, 0.38, 0.43]),
  },
  dumbbell_quads_goblet: {
    male: tiers([0, 0.08, 0.17, 0.25, 0.34, 0.42, 0.51, 0.59, 0.68, 0.76]),
    female: tiers([0, 0.07, 0.13, 0.2, 0.27, 0.34, 0.41, 0.47, 0.54, 0.61]),
  },

  // --- DEADLIFT (van den Hoek 2024: Legend M 3.25×, F 2.66×, ratio F/H 82%) ---
  barbell_hamstrings: {
    male: tiers([0, 0.36, 0.72, 1.08, 1.44, 1.81, 2.17, 2.53, 2.89, 3.25]),
    female: tiers([0, 0.3, 0.59, 0.89, 1.18, 1.48, 1.77, 2.07, 2.36, 2.66]),
  },
  barbell_glutes_deadlift: {
    male: tiers([0, 0.36, 0.72, 1.08, 1.44, 1.81, 2.17, 2.53, 2.89, 3.25]),
    female: tiers([0, 0.3, 0.59, 0.89, 1.18, 1.48, 1.77, 2.07, 2.36, 2.66]),
  },
  barbell_hamstrings_rack: {
    male: tiers([0, 0.45, 0.91, 1.36, 1.82, 2.27, 2.73, 3.18, 3.64, 4.1]),
    female: tiers([0, 0.38, 0.76, 1.14, 1.51, 1.89, 2.27, 2.65, 3.02, 3.4]),
  },

  // --- TRICEPS ---
  barbell_triceps: {
    male: tiers([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]),
    female: tiers([0, 0.08, 0.15, 0.23, 0.3, 0.38, 0.45, 0.53, 0.6, 0.68]),
  },
  dumbbell_triceps: {
    male: tiers([0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.55, 0.62, 0.7]),
    female: tiers([0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.36, 0.42, 0.48, 0.53]),
  },
  cable_triceps: {
    male: tiers([0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.54, 0.63, 0.72, 0.81]),
    female: tiers([0, 0.07, 0.14, 0.21, 0.28, 0.35, 0.42, 0.49, 0.56, 0.63]),
  },

  // --- BICEPS ---
  barbell_biceps: {
    male: tiers([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]),
    female: tiers([0, 0.08, 0.15, 0.23, 0.3, 0.38, 0.45, 0.53, 0.6, 0.68]),
  },
  dumbbell_biceps: {
    male: tiers([0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.55, 0.6, 0.65]),
    female: tiers([0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.36, 0.42, 0.45, 0.48]),
  },
  cable_biceps: {
    male: tiers([0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.54, 0.63, 0.72, 0.81]),
    female: tiers([0, 0.07, 0.14, 0.21, 0.28, 0.35, 0.42, 0.49, 0.56, 0.63]),
  },

  // --- POIDS DU CORPS (ratio = lest/BW uniquement, pas corps+lest) ---
  "body weight_lats": {
    male: tiers([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.95]),
    female: tiers([0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.36, 0.42, 0.47, 0.55]),
  },
  "leverage machine_lats": {
    male: tiers([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.95]),
    female: tiers([0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.36, 0.42, 0.47, 0.55]),
  },
  "body weight_triceps": {
    male: tiers([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1]),
    female: tiers([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5]),
  },
  lever_triceps: {
    male: tiers([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1]),
    female: tiers([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5]),
  },
  "body weight_pectorals_pushup": {
    male: tiers([0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.28]),
    female: tiers([0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.2]),
  },
  "body weight_pectorals_dips": {
    male: tiers([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1]),
    female: tiers([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5]),
  },
  "body weight_upper back": {
    male: tiers([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5]),
    female: tiers([0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.3]),
  },

  // --- ISOLEMENT JAMBES (Strength Level: extension Elite 2.5×, curl ~80% extension) ---
  machine_quads_extension: {
    male: tiers([0, 0.28, 0.56, 0.83, 1.11, 1.39, 1.67, 1.94, 2.22, 2.5]),
    female: tiers([0, 0.22, 0.44, 0.67, 0.89, 1.11, 1.33, 1.56, 1.78, 2.0]),
  },
  machine_hamstrings: {
    male: tiers([0, 0.22, 0.44, 0.67, 0.89, 1.11, 1.33, 1.56, 1.78, 2.0]),
    female: tiers([0, 0.18, 0.36, 0.53, 0.71, 0.89, 1.07, 1.24, 1.42, 1.6]),
  },

  // --- MOLETS ---
  barbell_calves: {
    male: tiers([0, 0.13, 0.27, 0.4, 0.53, 0.67, 0.8, 0.93, 1.07, 1.2]),
    female: tiers([0, 0.11, 0.21, 0.32, 0.42, 0.53, 0.63, 0.74, 0.84, 0.95]),
  },
  dumbbell_calves: {
    male: tiers([0, 0.06, 0.13, 0.2, 0.27, 0.33, 0.4, 0.47, 0.53, 0.6]),
    female: tiers([0, 0.05, 0.11, 0.16, 0.22, 0.27, 0.33, 0.38, 0.44, 0.5]),
  },
  cable_calves: {
    male: tiers([0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84, 0.96, 1.08]),
    female: tiers([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]),
  },
  machine_calves: {
    male: tiers([0, 0.14, 0.29, 0.43, 0.58, 0.72, 0.87, 1.01, 1.16, 1.3]),
    female: tiers([0, 0.12, 0.23, 0.35, 0.46, 0.58, 0.69, 0.81, 0.92, 1.04]),
  },
  "body weight_calves": {
    male: tiers([0, 0.03, 0.07, 0.1, 0.13, 0.17, 0.2, 0.23, 0.27, 0.3]),
    female: tiers([0, 0.02, 0.05, 0.07, 0.1, 0.12, 0.15, 0.17, 0.2, 0.22]),
  },

  // --- HIP THRUST / GLUTE BRIDGE (Strength Level: Elite 3.5×) ---
  barbell_glutes_hipthrust: {
    male: tiers([0, 0.39, 0.78, 1.17, 1.56, 1.94, 2.33, 2.72, 3.11, 3.5]),
    female: tiers([0, 0.31, 0.62, 0.93, 1.24, 1.56, 1.87, 2.18, 2.49, 2.8]),
  },
  barbell_glutes_bridge: {
    male: tiers([0, 0.36, 0.71, 1.07, 1.42, 1.78, 2.13, 2.49, 2.84, 3.2]),
    female: tiers([0, 0.28, 0.56, 0.83, 1.11, 1.39, 1.67, 1.94, 2.22, 2.5]),
  },
  cable_glutes: {
    male: tiers([0, 0.35, 0.7, 1.05, 1.4, 1.75, 2.1, 2.45, 2.8, 3.15]),
    female: tiers([0, 0.28, 0.56, 0.84, 1.12, 1.4, 1.68, 1.96, 2.24, 2.52]),
  },
  dumbbell_glutes_bridge: {
    male: tiers([0, 0.07, 0.14, 0.2, 0.27, 0.34, 0.41, 0.47, 0.54, 0.6]),
    female: tiers([0, 0.06, 0.11, 0.17, 0.22, 0.28, 0.33, 0.39, 0.44, 0.5]),
  },

  // --- FENTES (lunge) ---
  dumbbell_quads_lunge: {
    male: tiers([0, 0.07, 0.14, 0.21, 0.28, 0.35, 0.42, 0.49, 0.56, 0.63]),
    female: tiers([0, 0.06, 0.11, 0.17, 0.22, 0.28, 0.33, 0.39, 0.44, 0.5]),
  },
  barbell_quads_lunge: {
    male: tiers([0, 0.18, 0.35, 0.53, 0.7, 0.88, 1.05, 1.23, 1.4, 1.58]),
    female: tiers([0, 0.14, 0.28, 0.42, 0.57, 0.71, 0.85, 0.99, 1.13, 1.27]),
  },

  // --- UPRIGHT ROW (trapèzes/épaules) ---
  barbell_delts_upright: {
    male: tiers([0, 0.11, 0.23, 0.34, 0.45, 0.57, 0.68, 0.79, 0.91, 1.02]),
    female: tiers([0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.54, 0.63, 0.72, 0.81]),
  },
  dumbbell_delts_upright: {
    male: tiers([0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36]),
    female: tiers([0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.27]),
  },
  cable_delts_upright: {
    male: tiers([0, 0.11, 0.22, 0.33, 0.44, 0.55, 0.66, 0.77, 0.88, 0.99]),
    female: tiers([0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.54, 0.63, 0.72, 0.81]),
  },

  // --- ÉLÉVATIONS (isolation épaules) ---
  barbell_delts_raise: {
    male: tiers([0, 0.04, 0.09, 0.13, 0.18, 0.22, 0.27, 0.31, 0.36, 0.4]),
    female: tiers([0, 0.03, 0.07, 0.1, 0.14, 0.17, 0.21, 0.24, 0.28, 0.31]),
  },
  dumbbell_delts_raise: {
    male: tiers([0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.27]),
    female: tiers([0, 0.02, 0.05, 0.07, 0.1, 0.12, 0.15, 0.17, 0.2, 0.23]),
  },
  cable_delts_raise: {
    male: tiers([0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36]),
    female: tiers([0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.27]),
  },

  // --- FACE PULL (tirage visage) ---
  cable_upper_back_facepull: {
    male: tiers([0, 0.05, 0.1, 0.15, 0.2, 0.24, 0.29, 0.34, 0.39, 0.44]),
    female: tiers([0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36]),
  },

  // --- ÉCARTÉS / FLY ---
  dumbbell_pectorals_fly: {
    male: tiers([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45]),
    female: tiers([0, 0.03, 0.07, 0.1, 0.14, 0.17, 0.21, 0.24, 0.28, 0.31]),
  },
  cable_pectorals_fly: {
    male: tiers([0, 0.08, 0.17, 0.25, 0.33, 0.42, 0.5, 0.58, 0.67, 0.75]),
    female: tiers([0, 0.06, 0.12, 0.19, 0.25, 0.31, 0.38, 0.44, 0.5, 0.56]),
  },

  // --- PULLOVER ---
  dumbbell_pectorals_pullover: {
    male: tiers([0, 0.11, 0.22, 0.33, 0.44, 0.55, 0.66, 0.77, 0.88, 0.99]),
    female: tiers([0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64, 0.72]),
  },
  cable_pectorals_pullover: {
    male: tiers([0, 0.1, 0.21, 0.31, 0.42, 0.52, 0.63, 0.73, 0.84, 0.94]),
    female: tiers([0, 0.08, 0.15, 0.23, 0.31, 0.39, 0.46, 0.54, 0.62, 0.7]),
  },
  barbell_pectorals_pullover: {
    male: tiers([0, 0.13, 0.27, 0.4, 0.53, 0.67, 0.8, 0.93, 1.07, 1.2]),
    female: tiers([0, 0.1, 0.2, 0.31, 0.41, 0.51, 0.61, 0.72, 0.82, 0.92]),
  },

  // --- AVANT-BRAS ---
  barbell_forearms: {
    male: tiers([0, 0.04, 0.09, 0.13, 0.18, 0.22, 0.27, 0.31, 0.36, 0.4]),
    female: tiers([0, 0.03, 0.07, 0.1, 0.14, 0.17, 0.21, 0.24, 0.28, 0.31]),
  },
  dumbbell_forearms: {
    male: tiers([0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.18]),
    female: tiers([0, 0.02, 0.03, 0.05, 0.07, 0.08, 0.1, 0.12, 0.13, 0.15]),
  },
  cable_forearms: {
    male: tiers([0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36]),
    female: tiers([0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.27]),
  },

  // --- ABDOMINAUX CHARGÉS ---
  cable_abs: {
    male: tiers([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45]),
    female: tiers([0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36]),
  },
  barbell_abs: {
    male: tiers([0, 0.04, 0.09, 0.13, 0.18, 0.22, 0.27, 0.31, 0.36, 0.4]),
    female: tiers([0, 0.03, 0.07, 0.1, 0.14, 0.17, 0.21, 0.24, 0.28, 0.31]),
  },
  lever_abs: {
    male: tiers([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45]),
    female: tiers([0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36]),
  },
  weighted_abs: {
    male: tiers([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45]),
    female: tiers([0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36]),
  },
  kettlebell_abs: {
    male: tiers([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45]),
    female: tiers([0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36]),
  },
  lever_biceps: {
    male: tiers([0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.54, 0.63, 0.72, 0.81]),
    female: tiers([0, 0.07, 0.14, 0.21, 0.28, 0.35, 0.42, 0.49, 0.56, 0.63]),
  },
  lever_calves: {
    male: tiers([0, 0.14, 0.29, 0.43, 0.58, 0.72, 0.87, 1.01, 1.16, 1.3]),
    female: tiers([0, 0.12, 0.23, 0.35, 0.46, 0.58, 0.69, 0.81, 0.92, 1.04]),
  },
  barbell_traps: {
    male: tiers([0, 0.11, 0.23, 0.34, 0.45, 0.57, 0.68, 0.79, 0.91, 1.02]),
    female: tiers([0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.54, 0.63, 0.72, 0.81]),
  },
  dumbbell_traps: {
    male: tiers([0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36]),
    female: tiers([0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.27]),
  },
  machine_traps: {
    male: tiers([0, 0.11, 0.23, 0.34, 0.45, 0.57, 0.68, 0.79, 0.91, 1.02]),
    female: tiers([0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.54, 0.63, 0.72, 0.81]),
  },
  lever_spine: {
    male: tiers([0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.27]),
    female: tiers([0, 0.02, 0.05, 0.07, 0.1, 0.12, 0.15, 0.17, 0.2, 0.22]),
  },
  machine_spine: {
    male: tiers([0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.27]),
    female: tiers([0, 0.02, 0.05, 0.07, 0.1, 0.12, 0.15, 0.17, 0.2, 0.22]),
  },
  machine_abductors: {
    male: tiers([0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8]),
    female: tiers([0, 0.16, 0.32, 0.48, 0.64, 0.8, 0.96, 1.12, 1.28, 1.44]),
  },
  machine_adductors: {
    male: tiers([0, 0.18, 0.36, 0.54, 0.72, 0.9, 1.08, 1.26, 1.44, 1.62]),
    female: tiers([0, 0.14, 0.28, 0.42, 0.56, 0.7, 0.84, 0.98, 1.12, 1.26]),
  },
  dumbbell_serratus: {
    male: tiers([0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.27]),
    female: tiers([0, 0.02, 0.05, 0.07, 0.1, 0.12, 0.15, 0.17, 0.2, 0.23]),
  },
  weighted_lats: {
    male: tiers([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.95]),
    female: tiers([0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.36, 0.42, 0.47, 0.55]),
  },
  "body weight_quads": {
    male: tiers([0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.05, 1.2, 1.35]),
    female: tiers([0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84, 0.96, 1.08]),
  },
  "body weight_glutes": {
    male: tiers([0, 0.18, 0.36, 0.53, 0.71, 0.89, 1.07, 1.24, 1.42, 1.6]),
    female: tiers([0, 0.14, 0.28, 0.42, 0.57, 0.71, 0.85, 0.99, 1.13, 1.27]),
  },
  "body weight_hamstrings": {
    male: tiers([0, 0.11, 0.22, 0.33, 0.44, 0.55, 0.66, 0.77, 0.88, 1.0]),
    female: tiers([0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.54, 0.63, 0.72, 0.8]),
  },
};

/** Exclusions inconditionnelles par nom */
const ALWAYS_EXCLUDED_PATTERNS = [
  "bodyweight squat",
  "burpee",
  "jump rope",
  "stretch",
  "stretching",
  "mountain climber",
  "russian twist",
] as const;

/** Exclusions si équipement non chargeable (policy loaded_only) */
const LOAD_SENSITIVE_PATTERNS = [
  "crunch",
  "sit-up",
  "sit up",
  "plank",
  "leg raise",
] as const;

const NON_LOADABLE_EQUIPMENT = [
  "band",
  "resistance band",
  "stability ball",
  "roller",
  "rope",
  "bosu ball",
  "wheel roller",
  "upper body ergometer",
  "elliptical machine",
  "stationary bike",
  "stepmill machine",
  "skierg machine",
] as const;

const LOADABLE_EQUIPMENT_HINTS = [
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "lever",
  "leverage",
  "smith",
  "weighted",
  "kettlebell",
  "ez barbell",
  "trap bar",
  "medicine ball",
  "sled",
  "assisted",
  "hammer",
  "tire",
] as const;

function isLoadableEquipment(equipment: string): boolean {
  const x = equipment.toLowerCase().trim();
  if (NON_LOADABLE_EQUIPMENT.some((nl) => x.includes(nl) || x === nl)) {
    return false;
  }
  return LOADABLE_EQUIPMENT_HINTS.some((hint) => x.includes(hint));
}

/** Exclusion volontaire : cardio, mobilité, bodyweight pur sans charge mesurable. */
export function isIntentionallyExcluded(
  equipment: string,
  target: string,
  exerciseName: string,
): boolean {
  const t = normalizeTarget(target);
  const n = exerciseName.toLowerCase();
  const eq = equipment.toLowerCase().trim();

  if (t === "cardio" || t === "cardiovascular system") return true;

  for (const pat of ALWAYS_EXCLUDED_PATTERNS) {
    if (n.includes(pat)) return true;
  }

  for (const pat of LOAD_SENSITIVE_PATTERNS) {
    if (n.includes(pat) && !isLoadableEquipment(equipment)) return true;
  }

  if (NON_LOADABLE_EQUIPMENT.some((nl) => eq.includes(nl) || eq === nl)) {
    return true;
  }

  if (eq === "assisted" && t === "abs") return true;

  if (eq === "body weight") {
    if (t === "abs" || t === "spine") return true;
    if (t === "abductors" || t === "adductors") return true;
    if (
      n.includes("toe touch") ||
      n.includes("flutter kick") ||
      n.includes("warm-up") ||
      n.includes("warm up")
    ) {
      return true;
    }
  }

  return false;
}

/** Normalise equipment API → clé de lookup */
function normalizeEquipment(e: string): string {
  const x = e.toLowerCase().trim();
  if (x === "weighted") return "weighted";
  if (x === "assisted") return "assisted";
  if (x.includes("medicine ball")) return "dumbbell";
  if (x.includes("trap bar")) return "barbell";
  if (x.includes("olympic barbell") || x.includes("smith")) return "barbell";
  if (x.includes("kettlebell")) return "dumbbell";
  if (x.includes("sled") || x.includes("tire") || x.includes("hammer"))
    return "machine";
  if (x.includes("barbell") || x.includes("ez barbell")) return "barbell";
  if (x.includes("dumbbell")) return "dumbbell";
  if (x.includes("cable")) return "cable";
  if (x.includes("lever") || x.includes("leg press")) return "lever";
  if (x.includes("machine")) return "machine";
  if (x.includes("body weight")) return "body weight";
  if (x.includes("leverage")) return "leverage machine";
  return x;
}

/** Normalise target API → clé */
function normalizeTarget(t: string): string {
  const x = t.toLowerCase().trim();
  if (x === "shoulders") return "delts";
  return x;
}

export interface ExerciseMetadata {
  equipment?: string;
  target?: string;
  bodyPart?: string;
}

/**
 * Résout (equipment, target, name) → clé standards.
 * Chaque combo a des ratios précis, pas de type intermédiaire.
 */
function getStandardsKey(
  equipment: string,
  target: string,
  exerciseName: string,
): string | null {
  if (isIntentionallyExcluded(equipment, target, exerciseName)) return null;

  const rawEq = equipment.toLowerCase().trim();
  const e = normalizeEquipment(equipment);
  const t = normalizeTarget(target);
  const n = exerciseName.toLowerCase();

  if (t === "cardio" || t === "cardiovascular system") return null;

  // --- Traps ---
  if (t === "traps") {
    if (e === "barbell") return "barbell_traps";
    if (e === "dumbbell") return "dumbbell_traps";
    if (e === "machine" || e === "leverage machine" || e === "lever")
      return "machine_traps";
    if (e === "cable") return "cable_delts_upright";
  }

  // --- Spine / extensions lombaires ---
  if (t === "spine") {
    if (e === "weighted") return "lever_spine";
    if (e === "barbell") return "lever_spine";
    if (e === "lever" || e === "leverage machine") return "lever_spine";
    if (e === "machine") return "machine_spine";
  }

  // --- Abductors / adductors ---
  if (t === "abductors") return "machine_abductors";
  if (t === "adductors") return "machine_adductors";

  // --- Serratus ---
  if (t === "serratus anterior") return "dumbbell_serratus";

  // --- Weighted (lest) ---
  if (e === "weighted") {
    if (t === "abs") return "weighted_abs";
    if (t === "lats") return "weighted_lats";
    if (t === "delts") return "dumbbell_delts_raise";
    if (t === "biceps") return "barbell_biceps";
    if (t === "triceps") return "barbell_triceps";
    if (t === "glutes") return "barbell_glutes_hipthrust";
    if (t === "pectorals") return "body weight_pectorals_pushup";
    if (t === "forearms") return "barbell_forearms";
    if (t === "spine") return "lever_spine";
    if (t === "quads") return "lever_quads";
    if (t === "hamstrings") return "machine_hamstrings";
  }

  // --- Assisted ---
  if (e === "assisted") {
    if (t === "lats") return "body weight_lats";
    if (t === "triceps") return "body weight_triceps";
    if (t === "pectorals")
      return n.includes("dip")
        ? "body weight_pectorals_dips"
        : "body weight_pectorals_pushup";
    if (t === "hamstrings") return "machine_hamstrings";
    if (t === "calves") return "body weight_calves";
    if (t === "quads") return "lever_quads";
    if (t === "glutes") return "barbell_glutes_bridge";
    if (t === "adductors") return "machine_adductors";
  }

  // --- Poids du corps / leverage ---
  if (e === "body weight" || e === "leverage machine") {
    if (t === "lats")
      return e === "body weight" ? "body weight_lats" : "leverage machine_lats";
    if (t === "triceps")
      return e === "body weight" ? "body weight_triceps" : "lever_triceps";
    if (t === "pectorals")
      return n.includes("dip")
        ? "body weight_pectorals_dips"
        : "body weight_pectorals_pushup";
    if (t === "upper back") return "body weight_upper back";
    if (t === "calves") return "body weight_calves";
    if (t === "glutes") {
      if (n.includes("hip thrust")) return "barbell_glutes_hipthrust";
      if (n.includes("bridge")) return "barbell_glutes_bridge";
      if (n.includes("step-up") || n.includes("step up"))
        return "dumbbell_quads_lunge";
      return "body weight_glutes";
    }
    if (t === "quads") {
      if (n.includes("lunge") || n.includes("step-up") || n.includes("step up"))
        return "dumbbell_quads_lunge";
      if (n.includes("sissy") || n.includes("pistol")) return "body weight_quads";
      return "body weight_quads";
    }
    if (t === "hamstrings") {
      if (n.includes("nordic") || n.includes("curl")) return "body weight_hamstrings";
      return "body weight_hamstrings";
    }
    if (t === "delts") return "dumbbell_delts_raise";
    if (t === "forearms") return "barbell_forearms";
  }

  // Charges externes
  if (n.includes("leg press") || (n.includes("leg") && n.includes("press"))) {
    if (t === "quads" || t === "glutes") return "lever_quads";
  }
  if (n.includes("tire flip") || n.includes("flip")) {
    if (t === "glutes") return "barbell_glutes_deadlift";
  }

  // Calves
  if (t === "calves") {
    if (e === "barbell") return "barbell_calves";
    if (e === "dumbbell") return "dumbbell_calves";
    if (e === "cable") return "cable_calves";
    if (e === "lever") return "lever_calves";
    if (e === "machine" || e === "leverage machine") return "lever_calves";
    if (e === "body weight") return "body weight_calves";
  }

  // Forearms
  if (t === "forearms") {
    if (e === "barbell") return "barbell_forearms";
    if (e === "dumbbell") return "dumbbell_forearms";
    if (e === "cable") return "cable_forearms";
    if (e === "leverage machine" || e === "lever") return "barbell_forearms";
  }

  // Abs (chargés uniquement)
  if (t === "abs") {
    if (rawEq.includes("kettlebell")) return "kettlebell_abs";
    if (e === "cable") return "cable_abs";
    if (e === "barbell") return "barbell_abs";
    if (e === "lever" || e === "leverage machine") return "lever_abs";
    if (e === "weighted") return "weighted_abs";
    if (e === "dumbbell") return "cable_abs";
    if (e === "machine") return "lever_abs";
  }

  if (e === "barbell") {
    if (t === "pectorals") {
      if (n.includes("pullover")) return "barbell_pectorals_pullover";
      return n.includes("incline")
        ? "barbell_pectorals_incline"
        : "barbell_pectorals";
    }
    if (t === "quads") {
      if (n.includes("lunge")) return "barbell_quads_lunge";
      return n.includes("hack") ? "barbell_quads_hack" : "barbell_quads";
    }
    if (t === "glutes") {
      if (n.includes("deadlift") || n.includes("rack pull"))
        return n.includes("rack")
          ? "barbell_hamstrings_rack"
          : "barbell_glutes_deadlift";
      if (n.includes("hip thrust")) return "barbell_glutes_hipthrust";
      if (n.includes("glute bridge") || n.includes("bridge"))
        return "barbell_glutes_bridge";
      return "barbell_glutes";
    }
    if (t === "hamstrings")
      return n.includes("rack")
        ? "barbell_hamstrings_rack"
        : "barbell_hamstrings";
    if (t === "upper back" || t === "lats")
      return t === "upper back" ? "barbell_upper_back" : "barbell_lats";
    if (t === "delts") {
      if (n.includes("upright")) return "barbell_delts_upright";
      if (
        n.includes("front raise") ||
        n.includes("lateral raise") ||
        n.includes("rear delt") ||
        n.includes("reverse fly")
      )
        return "barbell_delts_raise";
      return "barbell_delts";
    }
    if (t === "triceps") return "barbell_triceps";
    if (t === "biceps") return "barbell_biceps";
  }

  if (e === "dumbbell") {
    if (t === "pectorals") {
      if (n.includes("pullover")) return "dumbbell_pectorals_pullover";
      if (n.includes("fly") || n.includes("pec deck"))
        return "dumbbell_pectorals_fly";
      return n.includes("incline")
        ? "dumbbell_pectorals_incline"
        : "dumbbell_pectorals";
    }
    if (t === "quads") {
      if (n.includes("bulgarian")) return "dumbbell_quads_bulgarian";
      if (n.includes("goblet")) return "dumbbell_quads_goblet";
      if (n.includes("lunge")) return "dumbbell_quads_lunge";
      return "dumbbell_quads";
    }
    if (t === "glutes") {
      if (n.includes("bridge")) return "dumbbell_glutes_bridge";
      if (n.includes("hip thrust")) return "barbell_glutes_hipthrust";
      if (!n.includes("deadlift")) return "dumbbell_quads";
    }
    if (t === "hamstrings") {
      if (n.includes("deadlift")) return "barbell_hamstrings";
      return "machine_hamstrings";
    }
    if (t === "upper back" || t === "lats") return "dumbbell_upper_back";
    if (t === "delts") {
      if (n.includes("upright")) return "dumbbell_delts_upright";
      if (
        n.includes("front raise") ||
        n.includes("lateral raise") ||
        n.includes("rear delt") ||
        n.includes("reverse fly")
      )
        return "dumbbell_delts_raise";
      return "dumbbell_delts";
    }
    if (t === "triceps") return "dumbbell_triceps";
    if (t === "biceps") return "dumbbell_biceps";
  }

  if (e === "cable") {
    if (t === "pectorals") {
      if (n.includes("pullover")) return "cable_pectorals_pullover";
      if (n.includes("fly") || n.includes("crossover"))
        return "cable_pectorals_fly";
      return "cable_pectorals";
    }
    if (t === "upper back" || t === "lats") {
      if (n.includes("face pull")) return "cable_upper_back_facepull";
      return t === "upper back" ? "cable_upper_back" : "cable_lats";
    }
    if (t === "glutes" && (n.includes("hip") || n.includes("pull through")))
      return "cable_glutes";
    if (t === "delts") {
      if (n.includes("upright")) return "cable_delts_upright";
      if (
        n.includes("front raise") ||
        n.includes("lateral raise") ||
        n.includes("rear delt") ||
        n.includes("reverse fly")
      )
        return "cable_delts_raise";
      return "cable_delts";
    }
    if (t === "triceps") return "cable_triceps";
    if (t === "biceps") return "cable_biceps";
    if (t === "traps") return "cable_delts_upright";
    if (t === "adductors") return "machine_adductors";
  }

  if (e === "lever") {
    if (t === "quads")
      return n.includes("hack") ? "barbell_quads_hack" : "lever_quads";
    if (t === "hamstrings" && n.includes("curl")) return "machine_hamstrings";
    if (t === "triceps") return "lever_triceps";
    if (t === "calves") return "lever_calves";
    if (t === "biceps") return "lever_biceps";
    if (t === "abs") return "lever_abs";
    if (t === "spine") return "lever_spine";
    if (t === "glutes") {
      if (n.includes("hip") || n.includes("good morning"))
        return n.includes("good morning")
          ? "barbell_hamstrings"
          : "barbell_glutes_hipthrust";
      return "barbell_glutes_hipthrust";
    }
    if (t === "traps") return "machine_traps";
    if (t === "abductors") return "machine_abductors";
    if (t === "adductors") return "machine_adductors";
    if (t === "forearms") return "barbell_forearms";
  }

  if (e === "machine" || e === "leverage machine") {
    if (t === "pectorals" && !n.includes("fly")) return "machine_pectorals";
    if (t === "upper back" || t === "lats") return "machine_upper_back";
    if (t === "delts" && !n.includes("lateral") && !n.includes("reverse"))
      return "machine_delts";
    if (t === "quads") {
      if (n.includes("extension")) return "machine_quads_extension";
      return n.includes("hack") ? "barbell_quads_hack" : "lever_quads";
    }
    if (t === "hamstrings" && n.includes("curl")) return "machine_hamstrings";
    if (t === "glutes") {
      if (n.includes("hip thrust") || n.includes("kickback") || n.includes("hip extension"))
        return "barbell_glutes_hipthrust";
      if (n.includes("good morning")) return "barbell_hamstrings";
      if (n.includes("reverse hyper")) return "lever_spine";
    }
    if (t === "triceps")
      return n.includes("dip") ? "lever_triceps" : "cable_triceps";
    if (t === "biceps")
      return n.includes("preacher") || n.includes("hammer")
        ? "lever_biceps"
        : "cable_biceps";
    if (t === "calves") return "lever_calves";
    if (t === "traps") return "machine_traps";
    if (t === "spine") return "lever_spine";
    if (t === "abs") return "lever_abs";
    if (t === "abductors") return "machine_abductors";
    if (t === "adductors") return "machine_adductors";
    if (t === "forearms") return "barbell_forearms";
  }

  return null;
}

/** Fallback nom → (equipment, target) pour exercices custom ou sans metadata */
function getEquipmentTargetFromName(
  name: string,
): { equipment: string; target: string } | null {
  const n = name.toLowerCase();
  if (n.includes("bench") || n.includes("chest press"))
    return { equipment: "barbell", target: "pectorals" };
  if (n.includes("squat") && !n.includes("bodyweight")) {
    if (n.includes("bulgarian"))
      return { equipment: "dumbbell", target: "quads" };
    if (n.includes("goblet")) return { equipment: "dumbbell", target: "quads" };
    if (n.includes("leg press")) return { equipment: "lever", target: "quads" };
    if (n.includes("hack")) return { equipment: "barbell", target: "quads" };
    return { equipment: "barbell", target: "quads" };
  }
  if (n.includes("deadlift") || n.includes("romanian"))
    return { equipment: "barbell", target: "hamstrings" };
  if (n.includes("rack pull"))
    return { equipment: "barbell", target: "hamstrings" };
  if (
    (n.includes("military") ||
      n.includes("overhead") ||
      n.includes("shoulder press")) &&
    !n.includes("upright")
  )
    return { equipment: "barbell", target: "delts" };
  if (n.includes("row") && !n.includes("upright"))
    return { equipment: "barbell", target: "upper back" };
  if (n.includes("pulldown")) return { equipment: "cable", target: "lats" };
  if (
    n.includes("tricep") ||
    n.includes("skull crusher") ||
    n.includes("pushdown")
  ) {
    if (n.includes("dip"))
      return { equipment: "body weight", target: "triceps" };
    return { equipment: "barbell", target: "triceps" };
  }
  if ((n.includes("curl") && n.includes("bicep")) || n.includes("hammer curl"))
    return { equipment: "barbell", target: "biceps" };
  if (n.includes("pull-up") || n.includes("chin-up"))
    return { equipment: "body weight", target: "lats" };
  if (n.includes("dip")) return { equipment: "body weight", target: "triceps" };
  if (n.includes("push-up") || n.includes("push up"))
    return { equipment: "body weight", target: "pectorals" };
  if (n.includes("inverted row"))
    return { equipment: "body weight", target: "upper back" };
  if (n.includes("leg extension")) return { equipment: "machine", target: "quads" };
  if (n.includes("leg curl")) return { equipment: "machine", target: "hamstrings" };
  if (n.includes("calf raise") || n.includes("mollet"))
    return { equipment: "barbell", target: "calves" };
  if (n.includes("hip thrust")) return { equipment: "barbell", target: "glutes" };
  if (n.includes("glute bridge") || n.includes("pont fessier"))
    return { equipment: "barbell", target: "glutes" };
  if (n.includes("lunge") || n.includes("fente"))
    return { equipment: "dumbbell", target: "quads" };
  if (n.includes("upright row") || n.includes("rowing menton"))
    return { equipment: "barbell", target: "delts" };
  if (n.includes("face pull")) return { equipment: "cable", target: "upper back" };
  if (
    n.includes("lateral raise") ||
    n.includes("front raise") ||
    n.includes("rear delt") ||
    n.includes("oiseau")
  )
    return { equipment: "dumbbell", target: "delts" };
  if (n.includes("fly") || n.includes("écarté"))
    return { equipment: "dumbbell", target: "pectorals" };
  if (n.includes("pullover") || n.includes("pull-over"))
    return { equipment: "dumbbell", target: "pectorals" };
  if (n.includes("wrist curl") || n.includes("curl poignet"))
    return { equipment: "barbell", target: "forearms" };
  if (
    (n.includes("crunch") || n.includes("relevé") || n.includes("abdo")) &&
    (n.includes("cable") || n.includes("poulie") || n.includes("charge"))
  )
    return { equipment: "cable", target: "abs" };
  if (n.includes("shrug")) return { equipment: "barbell", target: "traps" };
  if (n.includes("back extension") || n.includes("hyperextension"))
    return { equipment: "leverage machine", target: "spine" };
  if (n.includes("hip abduction")) return { equipment: "leverage machine", target: "abductors" };
  if (n.includes("hip adduction")) return { equipment: "leverage machine", target: "adductors" };
  if (n.includes("preacher curl"))
    return { equipment: "leverage machine", target: "biceps" };
  if (n.includes("good morning"))
    return { equipment: "barbell", target: "hamstrings" };
  if (n.includes("serratus") || n.includes("protraction"))
    return { equipment: "dumbbell", target: "serratus anterior" };
  if (n.includes("hang clean") || n.includes("clean"))
    return { equipment: "barbell", target: "hamstrings" };
  if (n.includes("step-up") || n.includes("step up"))
    return { equipment: "body weight", target: "glutes" };
  if (n.includes("squatting row"))
    return { equipment: "body weight", target: "upper back" };
  if (n.includes("curl-up")) return { equipment: "body weight", target: "abs" };
  if (n.includes("gorilla chin")) return { equipment: "body weight", target: "abs" };
  return null;
}

function getStandards(
  equipment: string,
  target: string,
  exerciseName: string,
): StandardsEntry | null {
  const key = getStandardsKey(equipment, target, exerciseName);
  const raw = key ? STANDARDS_BY_EQUIPMENT_TARGET[key] : null;
  return raw ? expandStandardsEntry(raw) : null;
}

/** Clés dumbbell/kettlebell : ratio = poids d'un seul haltère / poids du corps */
const DUMBBELL_STANDARDS_KEYS = new Set([
  "dumbbell_pectorals",
  "dumbbell_pectorals_incline",
  "dumbbell_pectorals_fly",
  "dumbbell_pectorals_pullover",
  "dumbbell_upper_back",
  "dumbbell_delts",
  "dumbbell_delts_upright",
  "dumbbell_delts_raise",
  "dumbbell_quads",
  "dumbbell_quads_bulgarian",
  "dumbbell_quads_goblet",
  "dumbbell_quads_lunge",
  "dumbbell_glutes_bridge",
  "dumbbell_calves",
  "dumbbell_forearms",
  "dumbbell_triceps",
  "dumbbell_biceps",
]);

/** Clés qui utilisent poids du corps + lest (ratio min 1.0) */
const BODYWEIGHT_STANDARDS_KEYS = new Set([
  "body weight_lats",
  "leverage machine_lats",
  "body weight_triceps",
  "lever_triceps",
  "body weight_pectorals_pushup",
  "body weight_pectorals_dips",
  "body weight_upper back",
  "weighted_lats",
]);

function isBodyweightAdditiveKey(key: string | null): boolean {
  return key !== null && BODYWEIGHT_STANDARDS_KEYS.has(key);
}

function isDumbbellStandardsKey(key: string | null): boolean {
  return key !== null && DUMBBELL_STANDARDS_KEYS.has(key);
}

export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export interface TierInfo {
  rankId: RankId;
  tier: LeagueTier;
  subRank: 1 | 2 | 3 | null;
  label: string;
  tierLabel: string;
  weightMin: number;
  weightMax: number | null;
}

export function getAllTiers(
  bodyWeightKg: number,
  gender: "male" | "female",
  exerciseName: string,
  exerciseMetadata?: ExerciseMetadata,
): TierInfo[] | null {
  const equipment = exerciseMetadata?.equipment;
  const target = exerciseMetadata?.target;

  let standards: StandardsEntry | null = null;
  if (equipment && target) {
    standards = getStandards(equipment, target, exerciseName);
  }
  if (!standards) {
    const fallback = getEquipmentTargetFromName(exerciseName);
    if (fallback)
      standards = getStandards(
        fallback.equipment,
        fallback.target,
        exerciseName,
      );
  }
  if (!standards || bodyWeightKg <= 0) return null;

  const rankTiers = standards[gender];
  return rankTiers.map((s, i) => {
    const { tier, subRank } = parseRankId(s.rankId);
    return {
      rankId: s.rankId,
      tier,
      subRank,
      label: s.label,
      tierLabel: leagueTierToFrenchLabel(tier),
      weightMin: Math.round(bodyWeightKg * s.ratio * 10) / 10,
      weightMax:
        i < rankTiers.length - 1
          ? Math.round(bodyWeightKg * rankTiers[i + 1]!.ratio * 10) / 10
          : null,
    };
  });
}

export function isBodyweightAdditiveExercise(
  exerciseName: string,
  exerciseMetadata?: ExerciseMetadata,
): boolean {
  const equipment =
    exerciseMetadata?.equipment ??
    getEquipmentTargetFromName(exerciseName)?.equipment;
  const target =
    exerciseMetadata?.target ??
    getEquipmentTargetFromName(exerciseName)?.target;
  if (!equipment || !target) return false;
  const key = getStandardsKey(equipment, target, exerciseName);
  return isBodyweightAdditiveKey(key);
}

/** Vrai si l'exercice utilise les standards dumbbell : ratio = poids d'un seul haltère / BW */
export function isDumbbellExercise(
  exerciseName: string,
  exerciseMetadata?: ExerciseMetadata,
): boolean {
  const equipment =
    exerciseMetadata?.equipment ??
    getEquipmentTargetFromName(exerciseName)?.equipment;
  const target =
    exerciseMetadata?.target ??
    getEquipmentTargetFromName(exerciseName)?.target;
  if (!equipment || !target) return false;
  const key = getStandardsKey(equipment, target, exerciseName);
  return isDumbbellStandardsKey(key);
}

export interface LeagueInput {
  weight: number;
  reps: number;
  bodyWeightKg: number;
  gender: "male" | "female";
  exerciseName: string;
  exerciseMetadata?: ExerciseMetadata;
}

export function getLeagueInfo(input: LeagueInput): LeagueInfo | null {
  const equipment = input.exerciseMetadata?.equipment;
  const target = input.exerciseMetadata?.target;

  let standards: StandardsEntry | null = null;
  if (equipment && target) {
    standards = getStandards(equipment, target, input.exerciseName);
  }
  if (!standards) {
    const fallback = getEquipmentTargetFromName(input.exerciseName);
    if (fallback)
      standards = getStandards(
        fallback.equipment,
        fallback.target,
        input.exerciseName,
      );
  }
  if (!standards) return null;

  const tiers = standards[input.gender];
  const key =
    equipment && target
      ? getStandardsKey(equipment, target, input.exerciseName)
      : null;
  const isBodyweight = isBodyweightAdditiveKey(key);
  // Exos poids du corps : on estime le 1RM total (corps + lest), puis on affiche uniquement le 1RM lesté (total - BW).
  let oneRM: number;
  if (isBodyweight && input.bodyWeightKg > 0) {
    const totalLoad = input.bodyWeightKg + input.weight;
    const totalOneRM = estimate1RM(totalLoad, input.reps);
    oneRM = Math.max(
      0,
      Math.round((totalOneRM - input.bodyWeightKg) * 10) / 10,
    );
  } else {
    oneRM = estimate1RM(input.weight, input.reps);
  }
  const ratio = input.bodyWeightKg > 0 ? oneRM / input.bodyWeightKg : 0;

  let rankIndex = 0;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (ratio >= tiers[i]!.ratio) {
      rankIndex = i;
      break;
    }
  }

  const rankId = tiers[rankIndex]!.rankId;
  const { tier, subRank } = parseRankId(rankId);
  const nextIndex = Math.min(rankIndex + 1, tiers.length - 1);
  const ratioMin = tiers[rankIndex]!.ratio;
  const ratioNext =
    rankIndex >= tiers.length - 1 ? Infinity : tiers[nextIndex]!.ratio;
  const weightToReach =
    rankIndex >= tiers.length - 1
      ? oneRM
      : Math.ceil(input.bodyWeightKg * ratioNext * 10) / 10;
  const weightTierStart = input.bodyWeightKg * ratioMin;
  const weightTierEnd =
    rankIndex >= tiers.length - 1
      ? null
      : Math.round(input.bodyWeightKg * ratioNext * 10) / 10;
  const span = ratioNext - ratioMin;
  const progressToNext =
    span > 0 && ratioNext < Infinity
      ? Math.min(1, Math.max(0, (ratio - ratioMin) / span))
      : 1;

  const percentileEstimate = percentileForRankIndex(rankIndex, progressToNext);

  return {
    rankId,
    tier,
    subRank,
    label: tiers[rankIndex]!.label,
    tierLabel: leagueTierToFrenchLabel(tier),
    oneRM,
    weightTierStart,
    weightTierEnd,
    ratioMin,
    ratioNext,
    weightToReach,
    progressToNext,
    nextRankId: getNextRankId(rankId),
    percentileEstimate: Math.min(99, Math.max(1, percentileEstimate)),
  };
}

/** Muscle cible pour regrouper les stats (métadonnées ou inférence depuis le nom). */
export function inferTargetForLeague(
  exerciseName: string,
  metadata?: ExerciseMetadata,
): string | null {
  const raw = metadata?.target?.toLowerCase().trim();
  if (raw && raw !== "cardio") {
    return normalizeTarget(raw);
  }
  const fb = getEquipmentTargetFromName(exerciseName);
  if (!fb) return null;
  return normalizeTarget(fb.target);
}

export type RankCoverageStatus = "ok" | "intentional" | "gap";

/** Classifie la couverture rang d'un exercice catalogue (audit / CI). */
export function classifyExerciseRankCoverage(
  exerciseName: string,
  metadata?: ExerciseMetadata,
): RankCoverageStatus {
  const equipment = metadata?.equipment ?? "";
  const target = metadata?.target ?? "";
  if (isIntentionallyExcluded(equipment, target, exerciseName)) {
    return "intentional";
  }
  if (
    getAllTiers(75, "male", exerciseName, metadata) ||
    getAllTiers(75, "female", exerciseName, metadata)
  ) {
    return "ok";
  }
  return "gap";
}
