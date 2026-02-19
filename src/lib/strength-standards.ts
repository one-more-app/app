/**
 * Système de ligues : ratio 1RM / poids du corps.
 * Chaque combinaison (equipment, target) a ses ratios précis.
 * Référence : ExRx.net, Symmetric Strength.
 */

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
  oneRM: number
  weightTierStart: number
  weightTierEnd: number | null
  ratioMin: number
  ratioNext: number
  weightToReach: number
  progressToNext: number
  percentileEstimate: number
}

type RatioTier = { ratio: number; label: string }

const TIER_LABELS = ['Fer', 'Bronze', 'Argent', 'Or', 'Platine', 'Émeraude', 'Diamant', 'Maître', 'Elite', 'Légende'] as const

const LEAGUE_ORDER: LeagueLevel[] = [
  'iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond', 'master', 'elite', 'legend',
]

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

/** Crée les paliers à partir des ratios (Fer=0 ou 1.0 pour PDC) */
function tiers(ratios: number[], labels = TIER_LABELS): RatioTier[] {
  return ratios.map((r, i) => ({ ratio: r, label: labels[i] ?? String(i) }))
}

// Standards par (equipment, target) – ratios précis pour chaque combinaison
// Clé: "equipment_target" ou "equipment_target_variant"
type StandardsEntry = Record<'male' | 'female', RatioTier[]>

const STANDARDS_BY_EQUIPMENT_TARGET: Record<string, StandardsEntry> = {
  // --- PECTORAUX ---
  barbell_pectorals: {
    male: tiers([0, 0.45, 0.65, 0.85, 1.05, 1.25, 1.45, 1.65, 1.9, 2.2]),
    female: tiers([0, 0.28, 0.42, 0.56, 0.7, 0.84, 0.98, 1.12, 1.28, 1.45]),
  },
  dumbbell_pectorals: {
    male: tiers([0, 0.15, 0.22, 0.29, 0.36, 0.43, 0.5, 0.57, 0.65, 0.75]),
    female: tiers([0, 0.1, 0.14, 0.19, 0.24, 0.28, 0.33, 0.38, 0.44, 0.5]),
  },
  cable_pectorals: {
    male: tiers([0, 0.43, 0.62, 0.81, 1, 1.19, 1.38, 1.57, 1.8, 2.1]),
    female: tiers([0, 0.26, 0.4, 0.53, 0.67, 0.8, 0.94, 1.07, 1.22, 1.37]),
  },
  machine_pectorals: {
    male: tiers([0, 0.45, 0.65, 0.85, 1.05, 1.25, 1.45, 1.65, 1.9, 2.2]),
    female: tiers([0, 0.28, 0.42, 0.56, 0.7, 0.84, 0.98, 1.12, 1.28, 1.45]),
  },
  // Incliné ~12% moins
  barbell_pectorals_incline: {
    male: tiers([0, 0.4, 0.57, 0.75, 0.92, 1.1, 1.28, 1.45, 1.67, 1.94]),
    female: tiers([0, 0.25, 0.37, 0.49, 0.62, 0.74, 0.86, 0.99, 1.13, 1.28]),
  },
  dumbbell_pectorals_incline: {
    male: tiers([0, 0.14, 0.19, 0.25, 0.31, 0.38, 0.43, 0.5, 0.57, 0.66]),
    female: tiers([0, 0.09, 0.13, 0.17, 0.21, 0.25, 0.29, 0.34, 0.39, 0.44]),
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
    male: tiers([0, 0.05, 0.09, 0.14, 0.18, 0.23, 0.27, 0.32, 0.36, 0.41]),
    female: tiers([0, 0.03, 0.07, 0.11, 0.14, 0.18, 0.21, 0.25, 0.28, 0.31]),
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

  // --- EPAULES / OVERHEAD ---
  barbell_delts: {
    male: tiers([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]),
    female: tiers([0, 0.08, 0.15, 0.23, 0.3, 0.38, 0.45, 0.53, 0.6, 0.68]),
  },
  dumbbell_delts: {
    male: tiers([0, 0.03, 0.07, 0.1, 0.14, 0.17, 0.2, 0.24, 0.27, 0.31]),
    female: tiers([0, 0.03, 0.05, 0.08, 0.1, 0.13, 0.15, 0.18, 0.2, 0.23]),
  },
  cable_delts: {
    male: tiers([0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.54, 0.63, 0.72, 0.81]),
    female: tiers([0, 0.07, 0.14, 0.21, 0.28, 0.35, 0.42, 0.49, 0.56, 0.63]),
  },
  machine_delts: {
    male: tiers([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]),
    female: tiers([0, 0.08, 0.15, 0.23, 0.3, 0.38, 0.45, 0.53, 0.6, 0.68]),
  },

  // --- QUADS / SQUAT ---
  barbell_quads: {
    male: tiers([0, 0.21, 0.41, 0.62, 0.82, 1.03, 1.23, 1.44, 1.64, 1.85]),
    female: tiers([0, 0.16, 0.31, 0.47, 0.62, 0.78, 0.93, 1.09, 1.24, 1.4]),
  },
  barbell_glutes: {
    male: tiers([0, 0.21, 0.41, 0.62, 0.82, 1.03, 1.23, 1.44, 1.64, 1.85]),
    female: tiers([0, 0.16, 0.31, 0.47, 0.62, 0.78, 0.93, 1.09, 1.24, 1.4]),
  },
  dumbbell_quads: {
    male: tiers([0, 0.09, 0.17, 0.25, 0.33, 0.41, 0.49, 0.57, 0.66, 0.75]),
    female: tiers([0, 0.06, 0.13, 0.19, 0.25, 0.31, 0.37, 0.43, 0.5, 0.56]),
  },
  lever_quads: {
    male: tiers([0, 0.28, 0.55, 0.84, 1.1, 1.39, 1.66, 1.94, 2.21, 2.5]),
    female: tiers([0, 0.22, 0.42, 0.63, 0.84, 1.05, 1.26, 1.47, 1.67, 1.9]),
  },
  barbell_quads_hack: {
    male: tiers([0, 0.2, 0.39, 0.59, 0.78, 0.98, 1.17, 1.37, 1.56, 1.76]),
    female: tiers([0, 0.15, 0.29, 0.45, 0.59, 0.74, 0.88, 1.04, 1.18, 1.33]),
  },
  dumbbell_quads_bulgarian: {
    male: tiers([0, 0.06, 0.12, 0.18, 0.23, 0.3, 0.35, 0.41, 0.47, 0.53]),
    female: tiers([0, 0.05, 0.09, 0.14, 0.18, 0.22, 0.27, 0.31, 0.35, 0.4]),
  },
  dumbbell_quads_goblet: {
    male: tiers([0, 0.09, 0.17, 0.25, 0.33, 0.41, 0.49, 0.57, 0.66, 0.75]),
    female: tiers([0, 0.06, 0.13, 0.19, 0.25, 0.31, 0.37, 0.43, 0.5, 0.56]),
  },

  // --- DEADLIFT ---
  barbell_hamstrings: {
    male: tiers([0, 0.23, 0.46, 0.68, 0.91, 1.14, 1.37, 1.59, 1.82, 2.05]),
    female: tiers([0, 0.18, 0.37, 0.55, 0.73, 0.92, 1.1, 1.28, 1.47, 1.65]),
  },
  barbell_glutes_deadlift: {
    male: tiers([0, 0.23, 0.46, 0.68, 0.91, 1.14, 1.37, 1.59, 1.82, 2.05]),
    female: tiers([0, 0.18, 0.37, 0.55, 0.73, 0.92, 1.1, 1.28, 1.47, 1.65]),
  },
  barbell_hamstrings_rack: {
    male: tiers([0, 0.21, 0.41, 0.61, 0.82, 1.03, 1.23, 1.43, 1.64, 1.85]),
    female: tiers([0, 0.16, 0.33, 0.5, 0.66, 0.83, 0.99, 1.15, 1.32, 1.49]),
  },

  // --- TRICEPS ---
  barbell_triceps: {
    male: tiers([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]),
    female: tiers([0, 0.08, 0.15, 0.23, 0.3, 0.38, 0.45, 0.53, 0.6, 0.68]),
  },
  dumbbell_triceps: {
    male: tiers([0, 0.03, 0.07, 0.1, 0.14, 0.17, 0.2, 0.24, 0.27, 0.31]),
    female: tiers([0, 0.03, 0.05, 0.08, 0.1, 0.13, 0.15, 0.18, 0.2, 0.23]),
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
    male: tiers([0, 0.03, 0.07, 0.1, 0.14, 0.17, 0.2, 0.24, 0.27, 0.31]),
    female: tiers([0, 0.03, 0.05, 0.08, 0.1, 0.13, 0.15, 0.18, 0.2, 0.23]),
  },
  cable_biceps: {
    male: tiers([0, 0.09, 0.18, 0.27, 0.36, 0.45, 0.54, 0.63, 0.72, 0.81]),
    female: tiers([0, 0.07, 0.14, 0.21, 0.28, 0.35, 0.42, 0.49, 0.56, 0.63]),
  },

  // --- POIDS DU CORPS (ratio = lest/BW uniquement, pas corps+lest) ---
  'body weight_lats': {
    male: tiers([0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.65, 0.75]),
    female: tiers([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5]),
  },
  'leverage machine_lats': {
    male: tiers([0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.65, 0.75]),
    female: tiers([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5]),
  },
  'body weight_triceps': {
    male: tiers([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1]),
    female: tiers([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5]),
  },
  lever_triceps: {
    male: tiers([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1]),
    female: tiers([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5]),
  },
  'body weight_pectorals_pushup': {
    male: tiers([0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.28]),
    female: tiers([0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14, 0.16, 0.2]),
  },
  'body weight_pectorals_dips': {
    male: tiers([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1]),
    female: tiers([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5]),
  },
  'body weight_upper back': {
    male: tiers([0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5]),
    female: tiers([0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.3]),
  },
}

/** Exclusions par nom (mouvements non adaptés au ratio 1RM) */
const EXCLUDED_PATTERNS = [
  'bodyweight squat', 'upright row', 'face pull', 'pullover', 'crossover', ' fly', 'front raise', 'lateral raise',
  'rear delt fly', 'reverse fly', 'lunge', 'leg extension', 'leg curl', 'calf raise', 'hip thrust', 'glute bridge',
  'crunch', 'sit-up', 'plank', 'leg raise', 'russian twist', 'mountain climber', 'burpee', 'jump rope',
]

/** Normalise equipment API → clé de lookup */
function normalizeEquipment(e: string): string {
  const x = e.toLowerCase().trim()
  if (x.includes('barbell') || x.includes('ez barbell') || x.includes('smith')) return 'barbell'
  if (x.includes('dumbbell') || x.includes('kettlebell')) return 'dumbbell'
  if (x.includes('cable')) return 'cable'
  if (x.includes('lever') || x.includes('leg press')) return 'lever'
  if (x.includes('machine')) return 'machine'
  if (x.includes('body weight')) return 'body weight'
  if (x.includes('leverage')) return 'leverage machine'
  return x
}

/** Normalise target API → clé */
function normalizeTarget(t: string): string {
  const x = t.toLowerCase().trim()
  if (x === 'shoulders') return 'delts'
  return x
}

export interface ExerciseMetadata {
  equipment?: string
  target?: string
  bodyPart?: string
}

/**
 * Résout (equipment, target, name) → clé standards.
 * Chaque combo a des ratios précis, pas de type intermédiaire.
 */
function getStandardsKey(
  equipment: string,
  target: string,
  exerciseName: string
): string | null {
  const e = normalizeEquipment(equipment)
  const t = normalizeTarget(target)
  const n = exerciseName.toLowerCase()

  if (['calves', 'forearms', 'abs', 'cardio'].includes(t)) return null

  for (const pat of EXCLUDED_PATTERNS) {
    if (n.includes(pat)) return null
  }
  if (n.includes('upright')) return null

  // Poids du corps / leverage
  if (e === 'body weight' || e === 'leverage machine') {
    if (t === 'lats') return e === 'body weight' ? 'body weight_lats' : 'leverage machine_lats'
    if (t === 'triceps') return e === 'body weight' ? 'body weight_triceps' : 'lever_triceps'
    if (t === 'pectorals') return n.includes('dip') ? 'body weight_pectorals_dips' : 'body weight_pectorals_pushup'
    if (t === 'upper back') return 'body weight_upper back'
  }

  // Charges externes
  if (n.includes('leg press')) {
    if (t === 'quads' || t === 'glutes') return 'lever_quads'
  }

  if (e === 'barbell') {
    if (t === 'pectorals') return n.includes('incline') ? 'barbell_pectorals_incline' : 'barbell_pectorals'
    if (t === 'quads') return n.includes('hack') ? 'barbell_quads_hack' : 'barbell_quads'
    if (t === 'glutes') {
      if (n.includes('deadlift') || n.includes('rack pull')) return n.includes('rack') ? 'barbell_hamstrings_rack' : 'barbell_glutes_deadlift'
      return 'barbell_glutes'
    }
    if (t === 'hamstrings') return n.includes('rack') ? 'barbell_hamstrings_rack' : 'barbell_hamstrings'
    if (t === 'upper back' || t === 'lats') return t === 'upper back' ? 'barbell_upper_back' : 'barbell_lats'
    if (t === 'delts') return 'barbell_delts'
    if (t === 'triceps') return 'barbell_triceps'
    if (t === 'biceps') return 'barbell_biceps'
  }

  if (e === 'dumbbell') {
    if (t === 'pectorals') return n.includes('incline') ? 'dumbbell_pectorals_incline' : 'dumbbell_pectorals'
    if (t === 'quads') {
      if (n.includes('bulgarian')) return 'dumbbell_quads_bulgarian'
      if (n.includes('goblet')) return 'dumbbell_quads_goblet'
      return 'dumbbell_quads'
    }
    if (t === 'glutes' && !n.includes('deadlift')) return 'dumbbell_quads'
    if (t === 'hamstrings' && n.includes('deadlift')) return 'barbell_hamstrings'
    if (t === 'upper back' || t === 'lats') return 'dumbbell_upper_back'
    if (t === 'delts') return 'dumbbell_delts'
    if (t === 'triceps') return 'dumbbell_triceps'
    if (t === 'biceps') return 'dumbbell_biceps'
  }

  if (e === 'cable') {
    if (t === 'pectorals' && !n.includes('fly') && !n.includes('crossover')) return 'cable_pectorals'
    if (t === 'upper back' || t === 'lats') return t === 'upper back' ? 'cable_upper_back' : 'cable_lats'
    if (t === 'delts') return 'cable_delts'
    if (t === 'triceps') return 'cable_triceps'
    if (t === 'biceps') return 'cable_biceps'
  }

  if (e === 'lever') {
    if (t === 'quads') return n.includes('hack') ? 'barbell_quads_hack' : 'lever_quads'
    if (t === 'triceps') return 'lever_triceps'
  }

  if (e === 'machine' || e === 'leverage machine') {
    if (t === 'pectorals' && !n.includes('fly')) return 'machine_pectorals'
    if (t === 'upper back' || t === 'lats') return 'machine_upper_back'
    if (t === 'delts' && !n.includes('lateral') && !n.includes('reverse')) return 'machine_delts'
    if (t === 'quads') return n.includes('hack') ? 'barbell_quads_hack' : n.includes('extension') ? null : 'lever_quads'
    if (t === 'triceps') return n.includes('dip') ? 'lever_triceps' : 'cable_triceps'
    if (t === 'biceps') return 'cable_biceps'
  }

  return null
}

/** Fallback nom → (equipment, target) pour exercices custom ou sans metadata */
function getEquipmentTargetFromName(name: string): { equipment: string; target: string } | null {
  const n = name.toLowerCase()
  if (n.includes('bench') || n.includes('chest press')) return { equipment: 'barbell', target: 'pectorals' }
  if (n.includes('squat') && !n.includes('bodyweight')) {
    if (n.includes('bulgarian')) return { equipment: 'dumbbell', target: 'quads' }
    if (n.includes('goblet')) return { equipment: 'dumbbell', target: 'quads' }
    if (n.includes('leg press')) return { equipment: 'lever', target: 'quads' }
    if (n.includes('hack')) return { equipment: 'barbell', target: 'quads' }
    return { equipment: 'barbell', target: 'quads' }
  }
  if (n.includes('deadlift') || n.includes('romanian')) return { equipment: 'barbell', target: 'hamstrings' }
  if (n.includes('rack pull')) return { equipment: 'barbell', target: 'hamstrings' }
  if ((n.includes('military') || n.includes('overhead') || n.includes('shoulder press')) && !n.includes('upright'))
    return { equipment: 'barbell', target: 'delts' }
  if (n.includes('row') && !n.includes('upright')) return { equipment: 'barbell', target: 'upper back' }
  if (n.includes('pulldown')) return { equipment: 'cable', target: 'lats' }
  if (n.includes('tricep') || n.includes('skull crusher') || n.includes('pushdown')) {
    if (n.includes('dip')) return { equipment: 'body weight', target: 'triceps' }
    return { equipment: 'barbell', target: 'triceps' }
  }
  if ((n.includes('curl') && n.includes('bicep')) || n.includes('hammer curl')) return { equipment: 'barbell', target: 'biceps' }
  if (n.includes('pull-up') || n.includes('chin-up')) return { equipment: 'body weight', target: 'lats' }
  if (n.includes('dip')) return { equipment: 'body weight', target: 'triceps' }
  if (n.includes('push-up') || n.includes('push up')) return { equipment: 'body weight', target: 'pectorals' }
  if (n.includes('inverted row')) return { equipment: 'body weight', target: 'upper back' }
  return null
}

function getStandards(
  equipment: string,
  target: string,
  exerciseName: string
): StandardsEntry | null {
  const key = getStandardsKey(equipment, target, exerciseName)
  return key ? STANDARDS_BY_EQUIPMENT_TARGET[key] ?? null : null
}

/** Clés dumbbell/kettlebell : ratio = poids d'un seul haltère / poids du corps */
const DUMBBELL_STANDARDS_KEYS = new Set([
  'dumbbell_pectorals', 'dumbbell_pectorals_incline', 'dumbbell_upper_back',
  'dumbbell_delts', 'dumbbell_quads', 'dumbbell_quads_bulgarian', 'dumbbell_quads_goblet',
  'dumbbell_triceps', 'dumbbell_biceps',
])

/** Clés qui utilisent poids du corps + lest (ratio min 1.0) */
const BODYWEIGHT_STANDARDS_KEYS = new Set([
  'body weight_lats', 'leverage machine_lats',
  'body weight_triceps', 'lever_triceps',
  'body weight_pectorals_pushup', 'body weight_pectorals_dips',
  'body weight_upper back',
])

function isBodyweightAdditiveKey(key: string | null): boolean {
  return key !== null && BODYWEIGHT_STANDARDS_KEYS.has(key)
}

function isDumbbellStandardsKey(key: string | null): boolean {
  return key !== null && DUMBBELL_STANDARDS_KEYS.has(key)
}

export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30) * 10) / 10
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
  exerciseName: string,
  exerciseMetadata?: ExerciseMetadata
): TierInfo[] | null {
  const equipment = exerciseMetadata?.equipment
  const target = exerciseMetadata?.target

  let standards: StandardsEntry | null = null
  if (equipment && target) {
    standards = getStandards(equipment, target, exerciseName)
  }
  if (!standards) {
    const fallback = getEquipmentTargetFromName(exerciseName)
    if (fallback) standards = getStandards(fallback.equipment, fallback.target, exerciseName)
  }
  if (!standards || bodyWeightKg <= 0) return null

  const tiers = standards[gender]
  return tiers.map((s, i) => ({
    level: LEAGUE_ORDER[i] as LeagueLevel,
    label: s.label,
    weightMin: Math.round(bodyWeightKg * s.ratio * 10) / 10,
    weightMax: i < tiers.length - 1 ? Math.round(bodyWeightKg * tiers[i + 1].ratio * 10) / 10 : null,
  }))
}

export function isBodyweightAdditiveExercise(
  exerciseName: string,
  exerciseMetadata?: ExerciseMetadata
): boolean {
  const equipment = exerciseMetadata?.equipment ?? getEquipmentTargetFromName(exerciseName)?.equipment
  const target = exerciseMetadata?.target ?? getEquipmentTargetFromName(exerciseName)?.target
  if (!equipment || !target) return false
  const key = getStandardsKey(equipment, target, exerciseName)
  return isBodyweightAdditiveKey(key)
}

/** Vrai si l'exercice utilise les standards dumbbell : ratio = poids d'un seul haltère / BW */
export function isDumbbellExercise(
  exerciseName: string,
  exerciseMetadata?: ExerciseMetadata
): boolean {
  const equipment = exerciseMetadata?.equipment ?? getEquipmentTargetFromName(exerciseName)?.equipment
  const target = exerciseMetadata?.target ?? getEquipmentTargetFromName(exerciseName)?.target
  if (!equipment || !target) return false
  const key = getStandardsKey(equipment, target, exerciseName)
  return isDumbbellStandardsKey(key)
}

export interface LeagueInput {
  weight: number
  reps: number
  bodyWeightKg: number
  gender: 'male' | 'female'
  exerciseName: string
  exerciseMetadata?: ExerciseMetadata
}

export function getLeagueInfo(input: LeagueInput): LeagueInfo | null {
  const equipment = input.exerciseMetadata?.equipment
  const target = input.exerciseMetadata?.target

  let standards: StandardsEntry | null = null
  if (equipment && target) {
    standards = getStandards(equipment, target, input.exerciseName)
  }
  if (!standards) {
    const fallback = getEquipmentTargetFromName(input.exerciseName)
    if (fallback) standards = getStandards(fallback.equipment, fallback.target, input.exerciseName)
  }
  if (!standards) return null

  const tiers = standards[input.gender]
  const key = equipment && target ? getStandardsKey(equipment, target, input.exerciseName) : null
  // Exos poids du corps : 1RM = poids lesté uniquement (pas corps + lest). Autres : charge ou poids/haltère.
  const oneRM = estimate1RM(input.weight, input.reps)
  const ratio = input.bodyWeightKg > 0 ? oneRM / input.bodyWeightKg : 0

  let levelIndex = 0
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (ratio >= tiers[i].ratio) {
      levelIndex = i
      break
    }
  }

  const level = LEAGUE_ORDER[levelIndex] as LeagueLevel
  const nextIndex = Math.min(levelIndex + 1, tiers.length - 1)
  const ratioMin = tiers[levelIndex].ratio
  const ratioNext = levelIndex >= tiers.length - 1 ? Infinity : tiers[nextIndex].ratio
  const weightToReach = levelIndex >= tiers.length - 1 ? oneRM : Math.ceil(input.bodyWeightKg * ratioNext * 10) / 10
  const weightTierStart = input.bodyWeightKg * ratioMin
  const weightTierEnd = levelIndex >= tiers.length - 1 ? null : Math.round(input.bodyWeightKg * ratioNext * 10) / 10
  const span = ratioNext - ratioMin
  const progressToNext = span > 0 && ratioNext < Infinity ? Math.min(1, Math.max(0, (ratio - ratioMin) / span)) : 1

  const percentileRange = RATIO_TO_PERCENTILE[level]
  const percentileEstimate = Math.round(
    percentileRange.min + progressToNext * (percentileRange.max - percentileRange.min)
  )

  return {
    level,
    label: tiers[levelIndex].label,
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
