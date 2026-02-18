/**
 * Classement de popularité des exercices.
 * Source: StrengthLog - analyse de millions de workouts (700 000+ utilisateurs).
 * @see https://www.strengthlog.com/most-popular-exercises/
 *
 * Les exercices sont triés du plus populaire au moins populaire.
 * Le matching se fait par inclusion du pattern dans le nom (lowercase).
 * Les patterns plus spécifiques doivent apparaître avant les génériques.
 */
const POPULARITY_ORDER: string[] = [
  // Top 25 StrengthLog (données réelles 2025)
  "barbell bench press",
  "bench press",
  "dumbbell bench press",
  "incline bench press",
  "barbell squat",
  "squat",
  "front squat",
  "barbell deadlift",
  "deadlift",
  "romanian deadlift",
  "sumo deadlift",
  "lat pulldown",
  "cable pulldown",
  "close grip lat pulldown",
  "overhead press",
  "military press",
  "barbell military press",
  "dumbbell shoulder press",
  "barbell row",
  "barbell bent over row",
  "bent over row",
  "dumbbell lateral raise",
  "lateral raise",
  "leg extension",
  "barbell curl",
  "bicep curl",
  "biceps curl",
  "incline dumbbell press",
  "dumbbell incline press",
  "barbell incline bench press",
  "leg press",
  "tricep pushdown",
  "tricep pushdown",
  "cable tricep pushdown",
  "pull-up",
  "chin-up",
  "wide grip pull-up",
  "dumbbell curl",
  "cable seated row",
  "seated row",
  "cable low seated row",
  "lying leg curl",
  "leg curl",
  "dumbbell row",
  "dumbbell bent over row",
  "dumbbell one arm bent-over row",
  "one arm row",
  "romanian deadlift",
  "seated leg curl",
  "standing leg curl",
  "hammer curl",
  "chest press",
  "dumbbell chest press",
  "cable chest fly",
  "cable crossover",
  "standing cable",
  "face pull",
  // Extensions populaires (hip thrust très populaire chez les femmes, etc.)
  "hip thrust",
  "glute bridge",
  "bulgarian split squat",
  "close grip bench press",
  "skull crusher",
  "lying triceps extension",
  "dips",
  "leg raise",
  "hanging leg raise",
  "calf raise",
  "standing calf raise",
  "seated calf raise",
  "front raise",
  "dumbbell front raise",
  "reverse fly",
  "rear delt fly",
  "pec deck fly",
  "dumbbell fly",
  "inverted row",
  "t-bar row",
  "goblet squat",
  "lunge",
  "walking lunge",
  "dumbbell lunge",
  "hack squat",
  "push-up",
  "plank",
  "crunch",
  "arnold press",
  "upright row",
  "concentration curl",
  "preacher curl",
  "cable curl",
  "pullover",
  "dumbbell pullover",
];

/** Map: pattern → rank (0 = plus populaire) */
const RANK_BY_PATTERN = new Map<string, number>(
  POPULARITY_ORDER.map((p, i) => [p.toLowerCase(), i]),
);

/**
 * Retourne le rang de popularité d'un exercice (0 = plus populaire, Infinity si non classé).
 */
export function getExercisePopularityRank(name: string): number {
  const lower = name.trim().toLowerCase();
  let bestRank = Infinity;

  for (const pattern of POPULARITY_ORDER) {
    if (lower === pattern || lower.includes(pattern)) {
      const rank = RANK_BY_PATTERN.get(pattern) ?? Infinity;
      if (rank < bestRank) bestRank = rank;
    }
  }

  return bestRank;
}
