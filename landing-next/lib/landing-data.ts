/**
 * Types et données de démo pour la landing — alignés sur l'app.
 */

export type LeagueLevel =
  | "iron"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "emerald"
  | "diamond"
  | "master"
  | "elite"
  | "legend";

export interface LeagueInfo {
  level: LeagueLevel;
  label: string;
  oneRM: number;
  weightTierStart: number;
  weightTierEnd: number | null;
  ratioMin: number;
  ratioNext: number;
  weightToReach: number;
  progressToNext: number;
  percentileEstimate: number;
}

export interface PerformanceEntry {
  id: string;
  trackedExerciseId: string;
  date: string;
  weight: number;
  reps: number;
  createdAt: string;
}

export const UI = {
  last: "Dernière",
  record: "Record",
  newPerf: "Nouvelle performance",
  percentileDescription: "Plus fort que {p}% des pratiquants",
  your1RM: "Ton 1RM (Une répétition max)",
  remainingForNext: "Il te manque {kg} kg pour",
  bodyWeightOnly: "Poids du corps",
  bodyWeightAbbr: "PDC",
};

const BODY_PARTS: Record<string, string> = {
  back: "Dos",
  chest: "Poitrine",
  shoulders: "Épaules",
  "upper arms": "Bras",
  "upper legs": "Cuisses",
  waist: "Taille",
};

const TARGETS: Record<string, string> = {
  pectorals: "Pectoraux",
  quadriceps: "Quadriceps",
  "upper back": "Haut du dos",
  lats: "Dorsaux",
};

export function translateBodyPart(en: string): string {
  return BODY_PARTS[en.toLowerCase()] ?? en;
}

export function translateTarget(en: string): string {
  return TARGETS[en.toLowerCase()] ?? en;
}

/** Couleurs des badges ligue (alignées avec l'app) */
export const LEAGUE_COLORS: Record<string, string> = {
  iron: "bg-zinc-700/50 text-zinc-200 border-zinc-500",
  bronze: "bg-amber-900/50 text-amber-200 border-amber-700",
  silver: "bg-slate-600/50 text-slate-200 border-slate-500",
  gold: "bg-amber-600/50 text-amber-100 border-amber-500",
  platinum: "bg-cyan-800/50 text-cyan-200 border-cyan-600",
  emerald: "bg-emerald-800/50 text-emerald-200 border-emerald-600",
  diamond: "bg-violet-600/50 text-violet-100 border-violet-500",
  master: "bg-rose-800/50 text-rose-100 border-rose-600",
  elite: "bg-emerald-700/50 text-emerald-100 border-emerald-500",
  legend: "bg-amber-500/60 text-amber-950 border-amber-400",
};

/** Données ligue pour Développé couché (Or, proche Platine) */
export const MOCK_LEAGUE_GOLD: LeagueInfo = {
  level: "gold",
  label: "Or",
  oneRM: 92,
  weightTierStart: 85.5,
  weightTierEnd: 105,
  ratioMin: 0.95,
  ratioNext: 1.17,
  weightToReach: 105,
  progressToNext: 0.65,
  percentileEstimate: 35,
};

/** Données ligue pour Squat (Platine, proche Émeraude) */
export const MOCK_LEAGUE_PLATINUM: LeagueInfo = {
  level: "platinum",
  label: "Platine",
  oneRM: 120,
  weightTierStart: 112,
  weightTierEnd: 132,
  ratioMin: 1.16,
  ratioNext: 1.36,
  weightToReach: 132,
  progressToNext: 0.5,
  percentileEstimate: 45,
};

/** Données ligue pour SDT (Argent) */
export const MOCK_LEAGUE_SILVER: LeagueInfo = {
  level: "silver",
  label: "Argent",
  oneRM: 130,
  weightTierStart: 118,
  weightTierEnd: 138,
  ratioMin: 1.14,
  ratioNext: 1.33,
  weightToReach: 138,
  progressToNext: 0.2,
  percentileEstimate: 22,
};

/** Ligue avec showNextTarget bien visible (proche du palier) */
export const MOCK_LEAGUE_DETAIL: LeagueInfo = {
  level: "gold",
  label: "Or",
  oneRM: 98,
  weightTierStart: 85.5,
  weightTierEnd: 105,
  ratioMin: 0.95,
  ratioNext: 1.17,
  weightToReach: 105,
  progressToNext: 0.88,
  percentileEstimate: 38,
};

/** Historique de démo pour le graphique (Développé couché) */
export const MOCK_CHART_ENTRIES: PerformanceEntry[] = [
  {
    id: "1",
    trackedExerciseId: "ex1",
    date: "2024-11-01",
    weight: 70,
    reps: 8,
    createdAt: "2024-11-01T10:00:00Z",
  },
  {
    id: "2",
    trackedExerciseId: "ex1",
    date: "2024-11-08",
    weight: 72,
    reps: 8,
    createdAt: "2024-11-08T10:00:00Z",
  },
  {
    id: "3",
    trackedExerciseId: "ex1",
    date: "2024-11-15",
    weight: 75,
    reps: 6,
    createdAt: "2024-11-15T10:00:00Z",
  },
  {
    id: "4",
    trackedExerciseId: "ex1",
    date: "2024-11-22",
    weight: 78,
    reps: 6,
    createdAt: "2024-11-22T10:00:00Z",
  },
  {
    id: "5",
    trackedExerciseId: "ex1",
    date: "2024-12-01",
    weight: 80,
    reps: 5,
    createdAt: "2024-12-01T10:00:00Z",
  },
  {
    id: "6",
    trackedExerciseId: "ex1",
    date: "2024-12-10",
    weight: 82,
    reps: 5,
    createdAt: "2024-12-10T10:00:00Z",
  },
  {
    id: "7",
    trackedExerciseId: "ex1",
    date: "2024-12-20",
    weight: 85,
    reps: 4,
    createdAt: "2024-12-20T10:00:00Z",
  },
  {
    id: "8",
    trackedExerciseId: "ex1",
    date: "2025-01-05",
    weight: 88,
    reps: 4,
    createdAt: "2025-01-05T10:00:00Z",
  },
  {
    id: "9",
    trackedExerciseId: "ex1",
    date: "2025-01-18",
    weight: 90,
    reps: 3,
    createdAt: "2025-01-18T10:00:00Z",
  },
  {
    id: "10",
    trackedExerciseId: "ex1",
    date: "2025-02-01",
    weight: 92,
    reps: 3,
    createdAt: "2025-02-01T10:00:00Z",
  },
];
