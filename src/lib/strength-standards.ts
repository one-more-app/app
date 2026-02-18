/**
 * Système de ligues basé sur les standards de force (ratio poids soulevé / poids du corps).
 * Référence : ExRx.net, Symmetric Strength, données powerlifting 2024.
 */

export type ExerciseStandardType =
  | 'bench'
  | 'squat'
  | 'deadlift'
  | 'overhead'
  | 'row'
  | 'triceps'
  | 'biceps'
  | null

export type LeagueLevel =
  | 'iron'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'emerald'
  | 'diamond'
  | 'master'
  | 'elite'
  | 'legend'

export interface LeagueInfo {
  level: LeagueLevel
  label: string
  /** 1RM estimé (kg) */
  oneRM: number
  /** Début du palier actuel (kg) */
  weightTierStart: number
  /** Fin du palier actuel = début du suivant (kg), ou null si Élite */
  weightTierEnd: number | null
  /** Ratio 1RM/BW atteint pour cette ligue */
  ratioMin: number
  /** Ratio pour la ligue suivante (ou Infinity si déjà élite) */
  ratioNext: number
  /** Poids à soulever pour monter (1RM estimé) */
  weightToReach: number
  /** Progression vers la ligue suivante (0-1) */
  progressToNext: number
  /** Percentile estimé dans la population (approx.) */
  percentileEstimate: number
}

// Standards H/F : ratio 1RM / poids du corps
// Paliers équidistants, max réduit (surtout pour exos haltère)
const STANDARDS: Record<
  ExerciseStandardType,
  Record<'male' | 'female', { ratio: number; label: string }[]>
> = {
  bench: {
    male: [
      { ratio: 0, label: 'Fer' },
      { ratio: 0.45, label: 'Bronze' },
      { ratio: 0.65, label: 'Argent' },
      { ratio: 0.85, label: 'Or' },
      { ratio: 1.05, label: 'Platine' },
      { ratio: 1.25, label: 'Émeraude' },
      { ratio: 1.45, label: 'Diamant' },
      { ratio: 1.65, label: 'Maître' },
      { ratio: 1.9, label: 'Elite' },
      { ratio: 2.2, label: 'Légende' },
    ],
    female: [
      { ratio: 0, label: 'Fer' },
      { ratio: 0.28, label: 'Bronze' },
      { ratio: 0.42, label: 'Argent' },
      { ratio: 0.56, label: 'Or' },
      { ratio: 0.7, label: 'Platine' },
      { ratio: 0.84, label: 'Émeraude' },
      { ratio: 0.98, label: 'Diamant' },
      { ratio: 1.12, label: 'Maître' },
      { ratio: 1.28, label: 'Elite' },
      { ratio: 1.45, label: 'Légende' },
    ],
  },
  squat: {
    male: [
      { ratio: 0, label: 'Fer' },
      { ratio: 0.21, label: 'Bronze' },
      { ratio: 0.41, label: 'Argent' },
      { ratio: 0.62, label: 'Or' },
      { ratio: 0.82, label: 'Platine' },
      { ratio: 1.03, label: 'Émeraude' },
      { ratio: 1.23, label: 'Diamant' },
      { ratio: 1.44, label: 'Maître' },
      { ratio: 1.64, label: 'Elite' },
      { ratio: 1.85, label: 'Légende' },
    ],
    female: [
      { ratio: 0, label: 'Fer' },
      { ratio: 0.16, label: 'Bronze' },
      { ratio: 0.31, label: 'Argent' },
      { ratio: 0.47, label: 'Or' },
      { ratio: 0.62, label: 'Platine' },
      { ratio: 0.78, label: 'Émeraude' },
      { ratio: 0.93, label: 'Diamant' },
      { ratio: 1.09, label: 'Maître' },
      { ratio: 1.24, label: 'Elite' },
      { ratio: 1.4, label: 'Légende' },
    ],
  },
  deadlift: {
    male: [
      { ratio: 0, label: 'Fer' },
      { ratio: 0.23, label: 'Bronze' },
      { ratio: 0.46, label: 'Argent' },
      { ratio: 0.68, label: 'Or' },
      { ratio: 0.91, label: 'Platine' },
      { ratio: 1.14, label: 'Émeraude' },
      { ratio: 1.37, label: 'Diamant' },
      { ratio: 1.59, label: 'Maître' },
      { ratio: 1.82, label: 'Elite' },
      { ratio: 2.05, label: 'Légende' },
    ],
    female: [
      { ratio: 0, label: 'Fer' },
      { ratio: 0.18, label: 'Bronze' },
      { ratio: 0.37, label: 'Argent' },
      { ratio: 0.55, label: 'Or' },
      { ratio: 0.73, label: 'Platine' },
      { ratio: 0.92, label: 'Émeraude' },
      { ratio: 1.1, label: 'Diamant' },
      { ratio: 1.28, label: 'Maître' },
      { ratio: 1.47, label: 'Elite' },
      { ratio: 1.65, label: 'Légende' },
    ],
  },
  overhead: {
    male: [
      { ratio: 0, label: 'Fer' },
      { ratio: 0.1, label: 'Bronze' },
      { ratio: 0.2, label: 'Argent' },
      { ratio: 0.3, label: 'Or' },
      { ratio: 0.4, label: 'Platine' },
      { ratio: 0.5, label: 'Émeraude' },
      { ratio: 0.6, label: 'Diamant' },
      { ratio: 0.7, label: 'Maître' },
      { ratio: 0.8, label: 'Elite' },
      { ratio: 0.9, label: 'Légende' },
    ],
    female: [
      { ratio: 0, label: 'Fer' },
      { ratio: 0.08, label: 'Bronze' },
      { ratio: 0.15, label: 'Argent' },
      { ratio: 0.23, label: 'Or' },
      { ratio: 0.3, label: 'Platine' },
      { ratio: 0.38, label: 'Émeraude' },
      { ratio: 0.45, label: 'Diamant' },
      { ratio: 0.53, label: 'Maître' },
      { ratio: 0.6, label: 'Elite' },
      { ratio: 0.68, label: 'Légende' },
    ],
  },
  row: {
    male: [
      { ratio: 0, label: 'Fer' },
      { ratio: 0.13, label: 'Bronze' },
      { ratio: 0.27, label: 'Argent' },
      { ratio: 0.4, label: 'Or' },
      { ratio: 0.53, label: 'Platine' },
      { ratio: 0.67, label: 'Émeraude' },
      { ratio: 0.8, label: 'Diamant' },
      { ratio: 0.93, label: 'Maître' },
      { ratio: 1.07, label: 'Elite' },
      { ratio: 1.2, label: 'Légende' },
    ],
    female: [
      { ratio: 0, label: 'Fer' },
      { ratio: 0.1, label: 'Bronze' },
      { ratio: 0.2, label: 'Argent' },
      { ratio: 0.31, label: 'Or' },
      { ratio: 0.41, label: 'Platine' },
      { ratio: 0.51, label: 'Émeraude' },
      { ratio: 0.61, label: 'Diamant' },
      { ratio: 0.72, label: 'Maître' },
      { ratio: 0.82, label: 'Elite' },
      { ratio: 0.92, label: 'Légende' },
    ],
  },
  triceps: {
    male: [
      { ratio: 0, label: 'Fer' },
      { ratio: 0.1, label: 'Bronze' },
      { ratio: 0.2, label: 'Argent' },
      { ratio: 0.3, label: 'Or' },
      { ratio: 0.4, label: 'Platine' },
      { ratio: 0.5, label: 'Émeraude' },
      { ratio: 0.6, label: 'Diamant' },
      { ratio: 0.7, label: 'Maître' },
      { ratio: 0.8, label: 'Elite' },
      { ratio: 0.9, label: 'Légende' },
    ],
    female: [
      { ratio: 0, label: 'Fer' },
      { ratio: 0.08, label: 'Bronze' },
      { ratio: 0.15, label: 'Argent' },
      { ratio: 0.23, label: 'Or' },
      { ratio: 0.3, label: 'Platine' },
      { ratio: 0.38, label: 'Émeraude' },
      { ratio: 0.45, label: 'Diamant' },
      { ratio: 0.53, label: 'Maître' },
      { ratio: 0.6, label: 'Elite' },
      { ratio: 0.68, label: 'Légende' },
    ],
  },
  biceps: {
    male: [
      { ratio: 0, label: 'Fer' },
      { ratio: 0.1, label: 'Bronze' },
      { ratio: 0.2, label: 'Argent' },
      { ratio: 0.3, label: 'Or' },
      { ratio: 0.4, label: 'Platine' },
      { ratio: 0.5, label: 'Émeraude' },
      { ratio: 0.6, label: 'Diamant' },
      { ratio: 0.7, label: 'Maître' },
      { ratio: 0.8, label: 'Elite' },
      { ratio: 0.9, label: 'Légende' },
    ],
    female: [
      { ratio: 0, label: 'Fer' },
      { ratio: 0.08, label: 'Bronze' },
      { ratio: 0.15, label: 'Argent' },
      { ratio: 0.23, label: 'Or' },
      { ratio: 0.3, label: 'Platine' },
      { ratio: 0.38, label: 'Émeraude' },
      { ratio: 0.45, label: 'Diamant' },
      { ratio: 0.53, label: 'Maître' },
      { ratio: 0.6, label: 'Elite' },
      { ratio: 0.68, label: 'Légende' },
    ],
  },
}

const LEAGUE_ORDER: LeagueLevel[] = [
  'iron',
  'bronze',
  'silver',
  'gold',
  'platinum',
  'emerald',
  'diamond',
  'master',
  'elite',
  'legend',
]

/** Estimation du percentile (paliers équidistants ≈ tranches égales) */
const RATIO_TO_PERCENTILE: Record<LeagueLevel, { min: number; max: number }> = {
  iron: { min: 0, max: 10 },
  bronze: { min: 10, max: 20 },
  silver: { min: 20, max: 30 },
  gold: { min: 30, max: 40 },
  platinum: { min: 40, max: 50 },
  emerald: { min: 50, max: 60 },
  diamond: { min: 60, max: 70 },
  master: { min: 70, max: 80 },
  elite: { min: 80, max: 90 },
  legend: { min: 90, max: 99 },
}

/**
 * Calcule le 1RM à partir du poids × reps (formule d'Epley).
 */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30) * 10) / 10
}

// Mapping explicite : noms API (lowercase) → type. Priorité sur le fallback par mots-clés.
const EXPLICIT_MAP: Record<string, ExerciseStandardType> = {
  // Bench
  'bench press': 'bench',
  'barbell bench press': 'bench',
  'dumbbell bench press': 'bench',
  'incline bench press': 'bench',
  'barbell incline bench press': 'bench',
  'dumbbell incline press': 'bench',
  'chest press': 'bench',
  'close grip bench press': 'bench',

  // Squat (exclut bodyweight, bulgarian, hack, leg press)
  'squat': 'squat',
  'barbell squat': 'squat',
  'front squat': 'squat',
  'barbell front squat': 'squat',
  'goblet squat': 'squat',

  // Deadlift
  'deadlift': 'deadlift',
  'barbell deadlift': 'deadlift',
  'romanian deadlift': 'deadlift',
  'sumo deadlift': 'deadlift',

  // Overhead (exclut upright row)
  'military press': 'overhead',
  'overhead press': 'overhead',
  'barbell military press': 'overhead',
  'dumbbell shoulder press': 'overhead',
  'arnold press': 'overhead',

  // Row / tirage dos (exclut upright row, chin-up, pull-up, face pull, inverted row)
  'bent over row': 'row',
  'barbell bent over row': 'row',
  'dumbbell bent over row': 'row',
  'one arm row': 'row',
  'dumbbell one arm bent-over row': 'row',
  't-bar row': 'row',
  'seated row': 'row',
  'cable seated row': 'row',
  'cable low seated row': 'row',
  'dumbbell row': 'row',
  'barbell row': 'row',
  'smith bent over row': 'row',
  'lat pulldown': 'row',
  'cable pulldown': 'row',
  'close grip lat pulldown': 'row',
  'straight arm pulldown': 'row',

  // Triceps
  'tricep extension': 'triceps',
  'triceps extension': 'triceps',
  'skull crusher': 'triceps',
  'lying triceps extension': 'triceps',
  'overhead tricep extension': 'triceps',
  'dumbbell tricep extension': 'triceps',
  'cable tricep pushdown': 'triceps',
  'tricep pushdown': 'triceps',

  // Biceps
  'bicep curl': 'biceps',
  'biceps curl': 'biceps',
  'barbell curl': 'biceps',
  'dumbbell curl': 'biceps',
  'hammer curl': 'biceps',
  'dumbbell hammer curl': 'biceps',
  'concentration curl': 'biceps',
  'preacher curl': 'biceps',
  'cable curl': 'biceps',
  'incline dumbbell curl': 'biceps',
  'ez bar curl': 'biceps',
  'reverse curl': 'biceps',
}

// Exercices sans suivi ligue (poids du corps, isolation, ratio inadapté)
const EXPLICIT_EXCLUSIONS = new Set([
  'bodyweight squat',
  'upright row',
  'barbell upright row',
  'chin-ups (narrow parallel grip)',
  'pull-up',
  'chin-up',
  'wide grip pull-up',
  'inverted row',
  'inverted row bent knees',
  'face pull',
  'push-up',
  'wide push-up',
  'diamond push-up',
  'decline push-up',
  'dips',
  'bench dip',
  'tricep dip',
  'bulgarian split squat',
  'hack squat',
  'leg press',
  'dumbbell pullover',
  'cable crossover',
  'pec deck fly',
  'dumbbell fly',
  'incline dumbbell fly',
  'cable chest fly',
  'front raise',
  'dumbbell front raise',
  'lateral raise',
  'dumbbell lateral raise',
  'cable lateral raise',
  'rear delt fly',
  'reverse fly',
  'lunge',
  'walking lunge',
  'dumbbell lunge',
  'leg extension',
  'leg curl',
  'lying leg curl',
  'standing leg curl',
  'seated leg curl',
  'calf raise',
  'standing calf raise',
  'seated calf raise',
  'donkey calf raise',
  'hip thrust',
  'glute bridge',
  'crunch',
  'sit-up',
  'plank',
  'leg raise',
  'hanging leg raise',
  'russian twist',
  'bicycle crunch',
  'mountain climber',
  'ab wheel roll-out',
  'cable crunch',
  'jump rope',
  'burpee',
  'box jump',
  'elevator',
  'standing archer',
])

/**
 * Mappe le nom d'exercice (API uniquement) vers un type standard.
 * Les exercices custom ne doivent pas appeler cette fonction (ligue = null).
 */
export function getExerciseStandardType(exerciseName: string): ExerciseStandardType {
  const n = exerciseName.toLowerCase().trim()

  const exact = EXPLICIT_MAP[n]
  if (exact) return exact

  if (EXPLICIT_EXCLUSIONS.has(n)) return null

  // Fallback par mots-clés (variantes API non listées)
  if (n.includes('bench press') || n.includes('chest press')) return 'bench'
  if (
    n.includes('squat') &&
    !n.includes('bulgarian') &&
    !n.includes('hack') &&
    !n.includes('leg press') &&
    !n.includes('bodyweight')
  )
    return 'squat'
  if (
    n.includes('deadlift') ||
    n.includes('romanian') ||
    n.includes('sumo deadlift')
  )
    return 'deadlift'
  if (
    (n.includes('military press') || n.includes('overhead press') || n.includes('shoulder press') || n.includes('arnold press')) &&
    !n.includes('upright row')
  )
    return 'overhead'
  if (
    n.includes('tricep') ||
    n.includes('triceps') ||
    n.includes('skull crusher') ||
    n.includes('pushdown')
  )
    return 'triceps'
  if (
    (n.includes('curl') && (n.includes('bicep') || n.includes('biceps'))) ||
    n.includes('hammer curl')
  )
    return 'biceps'
  if (
    (n.includes('row') && !n.includes('upright')) ||
    (n.includes('pulldown') && n.includes('lat')) ||
    (n.includes('bent over') && n.includes('row')) ||
    (n.includes('seated row') || n.includes('t-bar row'))
  )
    return 'row'

  return null
}

export interface TierInfo {
  level: LeagueLevel
  label: string
  weightMin: number
  weightMax: number | null
}

export function getAllTiers(
  bodyWeightKg: number,
  gender: 'male' | 'female',
  exerciseName: string
): TierInfo[] | null {
  const type = getExerciseStandardType(exerciseName)
  if (!type || bodyWeightKg <= 0) return null
  const rawStandards = STANDARDS[type][gender]
  const standards = isDumbbellExercise(exerciseName)
    ? rawStandards.map((s) => ({ ...s, ratio: s.ratio * DUMBBELL_RATIO_FACTOR }))
    : rawStandards
  return standards.map((s, i) => ({
    level: LEAGUE_ORDER[i] as LeagueLevel,
    label: s.label,
    weightMin: Math.round(bodyWeightKg * s.ratio * 10) / 10,
    weightMax:
      i < standards.length - 1
        ? Math.round(bodyWeightKg * standards[i + 1].ratio * 10) / 10
        : null,
  }))
}

/** Facteur de correction pour exercices haltères : standards plus accessibles */
const DUMBBELL_RATIO_FACTOR = 0.6

function isDumbbellExercise(exerciseName: string): boolean {
  const n = exerciseName.toLowerCase()
  return n.includes('dumbbell') || n.includes('haltère') || n.includes('haltères')
}

export interface LeagueInput {
  weight: number
  reps: number
  bodyWeightKg: number
  gender: 'male' | 'female'
  exerciseName: string
}

/**
 * Retourne les infos de ligue pour une perf donnée.
 */
export function getLeagueInfo(input: LeagueInput): LeagueInfo | null {
  const type = getExerciseStandardType(input.exerciseName)
  if (!type) return null

  const rawStandards = STANDARDS[type][input.gender]
  const standards = isDumbbellExercise(input.exerciseName)
    ? rawStandards.map((s) => ({ ...s, ratio: s.ratio * DUMBBELL_RATIO_FACTOR }))
    : rawStandards
  const oneRM = estimate1RM(input.weight, input.reps)
  const ratio = input.bodyWeightKg > 0 ? oneRM / input.bodyWeightKg : 0

  let levelIndex = 0
  for (let i = standards.length - 1; i >= 0; i--) {
    if (ratio >= standards[i].ratio) {
      levelIndex = i
      break
    }
  }

  const level = LEAGUE_ORDER[levelIndex] as LeagueLevel
  const nextIndex = Math.min(levelIndex + 1, standards.length - 1)
  const ratioMin = standards[levelIndex].ratio
  const ratioNext = levelIndex >= standards.length - 1
    ? Infinity
    : standards[nextIndex].ratio
  const weightToReach =
    levelIndex >= standards.length - 1
      ? oneRM
      : Math.ceil(input.bodyWeightKg * ratioNext * 10) / 10
  const weightTierStart = input.bodyWeightKg * ratioMin
  const weightTierEnd =
    levelIndex >= standards.length - 1
      ? null
      : Math.round(input.bodyWeightKg * ratioNext * 10) / 10
  const span = ratioNext - ratioMin
  const progressToNext =
    span > 0 && ratioNext < Infinity
      ? Math.min(1, Math.max(0, (ratio - ratioMin) / span))
      : 1

  const percentileRange = RATIO_TO_PERCENTILE[level]
  const percentileEstimate = Math.round(
    percentileRange.min + progressToNext * (percentileRange.max - percentileRange.min)
  )

  return {
    level,
    label: standards[levelIndex].label,
    oneRM,
    weightTierStart,
    weightTierEnd,
    ratioMin,
    ratioNext,
    weightToReach,
    progressToNext,
    percentileEstimate: Math.min(99, Math.max(1, percentileEstimate)),
  }
}
