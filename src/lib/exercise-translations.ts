/**
 * Traduction des noms d'exercices ExerciseDB (anglais → français).
 * L'API ne fournit que des noms en anglais. Ce dictionnaire permet de les afficher en français.
 * Clés en minuscules pour correspondre à l'API.
 */

// Dictionnaire exact : nom API (lowercase) → français
export const EXERCISE_NAMES: Record<string, string> = {
  // Pectoraux
  'bench press': 'Développé couché',
  'barbell bench press': 'Développé couché barre',
  'dumbbell bench press': 'Développé couché haltères',
  'incline bench press': 'Développé incliné',
  'barbell incline bench press': 'Développé incliné barre',
  'dumbbell incline press': 'Développé incliné haltères',
  'decline push-up': 'Pompes déclinées',
  'push-up': 'Pompes',
  'wide push-up': 'Pompes larges',
  'diamond push-up': 'Pompes diamant',
  'cable crossover': 'Écarté à la poulie',
  'pec deck fly': 'Écarté à la machine',
  'dumbbell fly': 'Écarté haltères',
  'incline dumbbell fly': 'Écarté incliné haltères',
  'chest press': 'Développé pectoraux',
  'cable chest fly': 'Écarté poulie',
  'dumbbell pullover': 'Pull-over haltère',

  // Épaules
  'military press': 'Développé militaire',
  'overhead press': 'Développé épaules',
  'barbell military press': 'Développé militaire barre',
  'dumbbell shoulder press': 'Développé haltères',
  'arnold press': 'Développé Arnold',
  'front raise': 'Élévation frontale',
  'dumbbell front raise': 'Élévation frontale haltères',
  'lateral raise': 'Élévation latérale',
  'dumbbell lateral raise': 'Élévation latérale haltères',
  'cable lateral raise': 'Élévation latérale poulie',
  'rear delt fly': 'Oiseau',
  'reverse fly': 'Oiseau',
  'face pull': 'Face pull',
  'upright row': 'Rowing menton',
  'barbell upright row': 'Rowing menton barre',

  // Dos
  'bent over row': 'Rowing buste penché',
  'barbell bent over row': 'Rowing barre buste penché',
  'dumbbell bent over row': 'Rowing haltères buste penché',
  'one arm row': 'Rowing un bras',
  'dumbbell one arm bent-over row': 'Rowing haltère un bras',
  't-bar row': 'Rowing barre T',
  'seated row': 'Rowing assis',
  'cable seated row': 'Tirage horizontal',
  'cable low seated row': 'Tirage horizontal bas',
  'inverted row': 'Tirage inversé',
  'inverted row bent knees': 'Tirage inversé genoux fléchis',
  'chin-ups (narrow parallel grip)': 'Tractions supination prise serrée',
  'pull-up': 'Tractions pronation',
  'chin-up': 'Tractions supination',
  'lat pulldown': 'Tirage vertical',
  'cable pulldown': 'Tirage vertical poulie',
  'wide grip pull-up': 'Tractions prise large',
  'close grip lat pulldown': 'Tirage vertical prise serrée',
  'straight arm pulldown': 'Tirage bras tendus',
  'deadlift': 'Soulevé de terre',
  'barbell deadlift': 'Soulevé de terre barre',
  'romanian deadlift': 'Soulevé de terre roumain',
  'sumo deadlift': 'Soulevé de terre sumo',
  'dumbbell row': 'Rowing haltères',
  'barbell row': 'Rowing barre',
  'smith bent over row': 'Rowing barre guidée buste penché',

  // Jambes
  'squat': 'Squat',
  'barbell squat': 'Squat barre',
  'bodyweight squat': 'Squat au poids du corps',
  'front squat': 'Squat avant',
  'barbell front squat': 'Squat avant barre',
  'goblet squat': 'Squat goblet',
  'leg press': 'Presse à cuisses',
  'hack squat': 'Hack squat',
  'lunge': 'Fente',
  'walking lunge': 'Fente marchée',
  'dumbbell lunge': 'Fente haltères',
  'bulgarian split squat': 'Squat bulgare',
  'leg extension': 'Extension de jambes',
  'leg curl': 'Leg curl',
  'lying leg curl': 'Leg curl allongé',
  'standing leg curl': 'Leg curl debout',
  'seated leg curl': 'Leg curl assis',
  'calf raise': 'Mollets',
  'standing calf raise': 'Mollets debout',
  'seated calf raise': 'Mollets assis',
  'donkey calf raise': 'Mollets âne',
  'hip thrust': 'Hip thrust',
  'glute bridge': 'Pont fessier',

  // Biceps
  'bicep curl': 'Curl biceps',
  'biceps curl': 'Curl biceps',
  'barbell curl': 'Curl barre',
  'dumbbell curl': 'Curl haltères',
  'hammer curl': 'Marteau',
  'dumbbell hammer curl': 'Marteau haltères',
  'concentration curl': 'Curl concentration',
  'preacher curl': 'Curl pupitre',
  'cable curl': 'Curl poulie',
  'incline dumbbell curl': 'Curl haltères incliné',
  'ez bar curl': 'Curl barre EZ',
  'reverse curl': 'Curl prise inversée',

  // Triceps
  'tricep extension': 'Extension triceps',
  'triceps extension': 'Extension triceps',
  'skull crusher': 'Skull crusher',
  'lying triceps extension': 'Extension triceps allongé',
  'overhead tricep extension': 'Extension triceps au-dessus de la tête',
  'dumbbell tricep extension': 'Extension triceps haltère',
  'cable tricep pushdown': 'Extension triceps poulie',
  'tricep pushdown': 'Extension triceps poulie',
  'close grip bench press': 'Développé couché prise serrée',
  'dips': 'Dips',
  'bench dip': 'Dips banc',
  'tricep dip': 'Dips triceps',

  // Abdominaux
  'crunch': 'Crunch',
  'sit-up': 'Relevé de buste',
  'plank': 'Gainage',
  'leg raise': 'Relevé de jambes',
  'hanging leg raise': 'Relevé de jambes à la barre',
  'russian twist': 'Russian twist',
  'bicycle crunch': 'Crunch bicyclette',
  'mountain climber': 'Mountain climber',
  'ab wheel roll-out': 'Roulette abdominale',
  'cable crunch': 'Crunch poulie',

  // Cardio / Divers
  'jump rope': 'Corde à sauter',
  'burpee': 'Burpee',
  'box jump': 'Saut sur box',
  'elevator': 'Élévation du buste',
  'standing archer': 'Archer debout',
}

/** Normalise les accents pour recherche insensible aux accents */
function normalizeAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Dictionnaire inverse : français → anglais pour la recherche.
 */
function buildSearchTranslations(): Record<string, string> {
  const frToEn: Record<string, string> = {}
  for (const [en, fr] of Object.entries(EXERCISE_NAMES)) {
    const key = fr.trim().toLowerCase()
    const keyNorm = normalizeAccents(key)
    if (!frToEn[key]) frToEn[key] = en
    if (keyNorm !== key && !frToEn[keyNorm]) frToEn[keyNorm] = en
  }
  return frToEn
}
export const EXERCISE_NAMES_FR_TO_EN = buildSearchTranslations()

/** Termes français → anglais pour recherche partielle */
const EXERCISE_TERMS_FR_TO_EN: Record<string, string> = {
  barre: 'barbell',
  haltère: 'dumbbell',
  haltères: 'dumbbells',
  poulie: 'cable',
  machine: 'machine',
  'poids du corps': 'bodyweight',
  'bande élastique': 'band',
  'barre guidée': 'smith machine',
  'barre ez': 'ez barbell',
  'médecine-ball': 'medicine ball',
  rowing: 'row',
  développé: 'press',
  flexion: 'curl',
  soulevé: 'deadlift',
  fente: 'lunge',
  fentes: 'lunges',
  élévation: 'raise',
  écarté: 'fly',
  extension: 'extension',
  incliné: 'incline',
  tirage: 'pull',
  poussée: 'push',
  traction: 'pull',
  tractions: 'pull',
  vertical: 'vertical',
  décliné: 'decline',
  'buste penché': 'bent over',
  'un bras': 'one arm',
  alterné: 'alternating',
  debout: 'standing',
  assis: 'seated',
  allongé: 'lying',
  'prise inversée': 'reverse grip',
  'prise serrée': 'narrow',
  'prise large': 'wide',
  // Parties du corps et muscles (recherche)
  dos: 'back',
  poitrine: 'chest',
  épaules: 'shoulders',
  bras: 'arms',
  'avant-bras': 'forearms',
  cuisses: 'legs',
  jambes: 'legs',
  taille: 'waist',
  cou: 'neck',
  abdominaux: 'abs',
  fessiers: 'glutes',
  mollets: 'calves',
  dorsaux: 'lats',
  'haut du dos': 'upper back',
  'bas du dos': 'lower back',
  'ischio-jambiers': 'hamstrings',
  trapèzes: 'traps',
  pectoraux: 'chest',
  gainage: 'plank',
  couché: 'bench',
  couche: 'bench',
  pompes: 'push',
}

/**
 * Trouve la meilleure correspondance par préfixe (phrases complètes).
 * Permet "develo cou" → "bench press" quand l'utilisateur tape incomplètement.
 */
function findPrefixMatchPhrase(normalizedInput: string): string | null {
  let best: { key: string; en: string } | null = null
  for (const [frKey, en] of Object.entries(EXERCISE_NAMES_FR_TO_EN)) {
    const frNorm = normalizeAccents(frKey)
    if (frNorm.startsWith(normalizedInput) && (!best || frNorm.length > best.key.length)) {
      best = { key: frNorm, en }
    }
  }
  return best?.en ?? null
}

/**
 * Remplace les mots par leur traduction, en supportant les mots incomplets (préfixe).
 * "develo" → "press", "pomp" → "push"
 */
function replaceTermsWithPrefixSupport(normalizedInput: string): string {
  const terms = Object.entries(EXERCISE_TERMS_FR_TO_EN)
    .map(([fr, en]) => [normalizeAccents(fr), en] as const)
    .sort((a, b) => b[0].length - a[0].length)

  const words = normalizedInput.split(/\s+/)
  const result = words.map((word) => {
    if (!word) return word
    for (const [frNorm, en] of terms) {
      if (frNorm === word || frNorm.startsWith(word)) {
        return en
      }
    }
    return word
  })
  return result.join(' ')
}

/**
 * Traduit une requête de recherche française vers l'anglais.
 * - Insensible à la casse
 * - Insensible aux accents
 * - Accepte les mots incomplets (préfixe)
 */
export function translateSearchQueryToEnglish(query: string): string {
  if (!query || typeof query !== 'string') return query
  const trimmed = query.trim()
  if (!trimmed) return trimmed

  const key = trimmed.toLowerCase()
  const normalizedInput = normalizeAccents(key)

  const exact =
    EXERCISE_NAMES_FR_TO_EN[key] ??
    EXERCISE_NAMES_FR_TO_EN[normalizedInput] ??
    null
  if (exact) return exact

  const prefixPhrase = findPrefixMatchPhrase(normalizedInput)
  if (prefixPhrase) return prefixPhrase

  const withTerms = replaceTermsWithPrefixSupport(normalizedInput)
  return withTerms.trim() || trimmed
}

// Termes courants pour traduction partielle (quand pas de correspondance exacte)
const EXERCISE_TERMS: Record<string, string> = {
  barbell: 'barre',
  dumbbell: 'haltère',
  dumbbells: 'haltères',
  kettlebell: 'kettlebell',
  cable: 'poulie',
  machine: 'machine',
  'body weight': 'poids du corps',
  'bodyweight': 'poids du corps',
  band: 'bande élastique',
  'smith machine': 'barre guidée',
  'ez barbell': 'barre EZ',
  'medicine ball': 'médecine-ball',
  row: 'rowing',
  rows: 'rowing',
  press: 'développé',
  curl: 'flexion',
  squat: 'squat',
  deadlift: 'soulevé de terre',
  lunge: 'fente',
  lunges: 'fentes',
  raise: 'élévation',
  fly: 'écarté',
  extension: 'extension',
  incline: 'incliné',
  pull: 'tirage',
  push: 'poussée',
  pullup: 'traction',
  'pull-up': 'traction',
  pulldown: 'tirage vertical',
  decline: 'décliné',
  'bent over': 'buste penché',
  'bent-over': 'buste penché',
  'one arm': 'un bras',
  'one-arm': 'un bras',
  alternating: 'alterné',
  standing: 'debout',
  seated: 'assis',
  lying: 'allongé',
  'reverse grip': 'prise inversée',
  'reverse-grip': 'prise inversée',
  narrow: 'prise serrée',
  wide: 'prise large',
  'high row': 'rowing haut',
  'low row': 'rowing bas',
  vertical: 'vertical',
  horizontal: 'horizontal',
}

function capitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Traduit un nom d'exercice de l'API (anglais) vers le français.
 * - Correspondance exacte d'abord
 * - Sinon, remplacement des termes connus
 * - Sinon, retour du nom original
 */
export function translateExerciseName(name: string): string {
  if (!name || typeof name !== 'string') return name
  const key = name.trim().toLowerCase()
  const exact = EXERCISE_NAMES[key]
  if (exact) return exact

  // Traduction partielle par termes
  let result = key
  const sortedTerms = Object.entries(EXERCISE_TERMS).sort(
    (a, b) => b[0].length - a[0].length
  )
  for (const [en, fr] of sortedTerms) {
    const regex = new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    result = result.replace(regex, fr)
  }

  // Éviter de retourner la même chose si aucune traduction
  if (result === key) return name

  return capitalize(result.split(/\s+/).map(capitalize).join(' '))
}
