/**
 * Top 15 "exercices les plus pratiqués en salle" basé sur l'étude StrengthLog
 * (millions de séances, 700k+ utilisateurs), puis mappé aux noms présents
 * dans notre base locale ExerciseDB.
 *
 * Sources:
 * - https://www.strengthlog.com/most-popular-exercises/
 * - https://app.fitbod.me/year/2021 (tendance cohérente sur les exos majeurs)
 */
export const RECOMMENDED_EXERCISE_LIMIT = 15;

type PopularExerciseSpec = {
  /** Nom d'exercice de l'étude */
  studyName: string;
  /**
   * Alias compatibles ExerciseDB (par ordre de préférence).
   * Le matching se fait par égalité stricte puis inclusion.
   */
  matchers: string[];
};

const POPULARITY_SPECS: PopularExerciseSpec[] = [
  { studyName: "bench press", matchers: ["barbell bench press"] },
  { studyName: "squat", matchers: ["barbell high bar squat"] },
  { studyName: "deadlift", matchers: ["barbell deadlift"] },
  { studyName: "lat pulldown", matchers: ["twin handle parallel grip lat pulldown"] },
  { studyName: "overhead press", matchers: ["barbell seated overhead press"] },
  { studyName: "barbell row", matchers: ["barbell bent over row"] },
  { studyName: "dumbbell lateral raise", matchers: ["dumbbell lateral raise"] },
  { studyName: "leg extension", matchers: ["lever leg extension"] },
  { studyName: "leg press", matchers: ["smith leg press"] },
  { studyName: "barbell curl", matchers: ["barbell curl"] },
  { studyName: "tricep pushdown with bar", matchers: ["cable one arm tricep pushdown"] },
  { studyName: "incline dumbbell press", matchers: ["dumbbell incline bench press"] },
  { studyName: "dumbbell curl", matchers: ["dumbbell biceps curl"] },
  { studyName: "pull-up", matchers: ["pull-up"] },
  { studyName: "cable close grip seated row", matchers: ["cable seated row"] },
];

function matchesNameByPattern(exerciseNameLower: string, patternLower: string): boolean {
  return exerciseNameLower === patternLower;
}

/**
 * Retourne le rang de popularité d'un exercice (0 = plus populaire, Infinity si non classé).
 */
export function getExercisePopularityRank(name: string): number {
  const lower = name.trim().toLowerCase();

  for (let i = 0; i < POPULARITY_SPECS.length; i += 1) {
    const spec = POPULARITY_SPECS[i];
    for (const matcher of spec.matchers) {
      if (matchesNameByPattern(lower, matcher.toLowerCase())) {
        return i;
      }
    }
  }

  return Infinity;
}

export function isRecommendedGymExercise(name: string): boolean {
  const rank = getExercisePopularityRank(name);
  return Number.isFinite(rank) && rank < RECOMMENDED_EXERCISE_LIMIT;
}
