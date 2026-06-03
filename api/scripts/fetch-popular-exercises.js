/**
 * Récupère les exercices de musculation classiques depuis ExerciseDB.
 *
 * Règles de tri (filtrage) :
 * - Muscu pure : exercices de force classiques
 * - Version basique : pas de variantes bizarres (stability ball, twisting...)
 * - Mots-clés inclus : press, squat, row, curl, deadlift, pull, raise, fly...
 * - Mots-clés exclus : band, stability, bosu, twisting, kneeling, jump...
 * - Équipement : barbell, dumbbell, cable, body weight, machine
 *
 * Parcourt tout le catalogue, filtre, et stocke en local.
 *
 * Usage: node scripts/fetch-popular-exercises.js
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import {
  EXERCISEDB_BASE,
  fetchAllExercisePages,
  mapExercise,
} from './exercisedb-fetch.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = join(__dirname, '../data/popular-exercises.filtered.json')

// Équipements acceptés (barre, haltères, poulies, machines, poids du corps classique)
const EQUIPMENT_OK = new Set([
  'barbell',
  'dumbbell',
  'dumbbells',
  'cable',
  'leverage machine',
  'smith machine',
  'ez barbell',
  'body weight',
])

// Mots-clés dans le NOM → on rejette (trop complexe, variante bizarre)
const EXCLUDE_PATTERNS = [
  /\bstability\b/i,
  /\bbosu\b/i,
  /\bball\b/i, // stability ball, medicine ball
  /\btwisting\b/i,
  /\brotat/i,
  /\bkneeling\b/i,
  /\bon knees\b/i,
  /\bband\b/i,
  /\bjump\b/i,
  /\bplyo/i,
  /\bsuspended\b/i,
  /\btrx\b/i,
  /\bwobble\b/i,
  /\bsingle leg\b/i,
  /\bone leg\b/i,
  /\bresistance band\b/i,
  /\bmedicine ball\b/i,
  /\bstep\b/i, // step-up etc
  /\brear lunge\b/i,
  /\bfrankenstein\b/i,
  /\bpotty\b/i,
  /\balternating\b/i,
  /\balternate\b/i,
  /\bwith pulse\b/i,
  /\bpure\b/i,
  /\(on [^)]+\)/i, // "(on stability ball)", "(on knees)"
  /\bclose-grip\b/i, // "close grip" (sans tiret) = classique
  /\breverse grip incline\b/i,
  /\blever [^ ]+ row\b/i, // lever alternating narrow grip seated row - trop spécifique
  // Poids du corps farfelu
  /\bhandstand\b/i,
  /\bpistol\b/i,
  /\bmuscle[- ]?up\b/i,
  /\bring\b/i,
  /\bplanche\b/i,
  /\bl[- ]?sit\b/i,
  /\bpike\b/i,
  /\bwall walk\b/i,
  /\bhollow hold\b/i,
  /\bsuperman\b/i,
  /\bburpee\b/i,
  /\bassisted\b/i,
  /\barcher\b/i,
]

// Mots-clés dans le NOM → on GARDE (exercices classiques)
const INCLUDE_PATTERNS = [
  /\b(press|bench)\b/i,
  /\bsquat\b/i,
  /\bdeadlift\b/i,
  /\brow\b/i,
  /\bcurl\b/i,
  /\bpull(-?up)?\b/i,
  /\bchin(-?up)?\b/i,
  /\bpulldown\b/i,
  /\brace\b/i,
  /\bfly\b/i,
  /\bextension\b/i,
  /\blunge\b/i,
  /\bdip\b/i,
  /\bcrossover\b/i,
  /\bthrust\b/i,
  /\bcalf\b/i,
  /\bcrunch\b/i,
  /\bplank\b/i,
  /\bpush[- ]?up\b/i,
  /\b(inverted|seated|standing|lying)\s+row\b/i,
  /\bleg (press|extension|curl)\b/i,
  /\b(preacher|concentration|hammer)\s+curl\b/i,
  /\b(skull|tricep|overhead)\b/i,
  /\b(lateral|front)\s+raise\b/i,
  /\bface pull\b/i,
  /\bgoblet\b/i,
  /\bfront squat\b/i,
  /\bromanian\b/i,
  /\bsumo\b/i,
]

// Nom trop long = souvent variante très spécifique (ex: "barbell reverse grip incline bench row")
const MAX_NAME_WORDS = 6

function isRelevant(raw) {
  const name = (raw.name || '').trim()

  // Exclure si pas d'image
  if (!raw.gifUrl || !String(raw.gifUrl).trim()) return false

  // Exclure si équipement non classique
  const equip = (raw.equipments?.[0] || '').toLowerCase()
  if (equip && !EQUIPMENT_OK.has(equip)) return false

  // Exclure si pattern exclu
  if (EXCLUDE_PATTERNS.some((p) => p.test(name))) return false

  // Exclure si nom trop long (variante très spécifique)
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length > MAX_NAME_WORDS) return false

  // Doit matcher au moins un pattern inclus
  if (!INCLUDE_PATTERNS.some((p) => p.test(name))) return false

  return true
}

function filterExisting() {
  if (!existsSync(OUT_PATH)) {
    console.log('Aucun fichier local à filtrer')
    return
  }
  const data = JSON.parse(readFileSync(OUT_PATH, 'utf-8'))
  if (!Array.isArray(data)) return
  const filtered = data.filter((ex) => isRelevant({
    exerciseId: ex.id,
    name: ex.name,
    equipments: ex.equipment ? [ex.equipment] : [],
    gifUrl: ex.gifUrl,
  }))
  const sorted = [...filtered].sort((a, b) =>
    a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
  )
  writeFileSync(OUT_PATH, JSON.stringify(sorted, null, 2), 'utf-8')
  console.log(`Filtré: ${data.length} → ${sorted.length} exercices`)
}

async function checkImageUrl(url) {
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    if (res.status === 405) {
      res = await fetch(url, { method: 'GET', redirect: 'follow' })
    }
    return res.ok
  } catch {
    return false
  }
}

async function filterBrokenImages() {
  if (!existsSync(OUT_PATH)) {
    console.log('Aucun fichier local')
    return
  }
  const data = JSON.parse(readFileSync(OUT_PATH, 'utf-8'))
  if (!Array.isArray(data)) return

  console.log(`Vérification de ${data.length} images...`)
  const keep = []

  for (let i = 0; i < data.length; i++) {
    const ex = data[i]
    const url = ex.gifUrl?.trim()
    process.stdout.write(`[${i + 1}/${data.length}] ${ex.name?.slice(0, 35)}... `)
    if (!url) {
      console.log('pas d\'URL')
      continue
    }
    const ok = await checkImageUrl(url)
    if (ok) {
      keep.push(ex)
      console.log('✓')
    } else {
      console.log('✗ lien cassé')
    }
    if ((i + 1) % 20 === 0) {
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  const sorted = [...keep].sort((a, b) =>
    a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
  )
  writeFileSync(OUT_PATH, JSON.stringify(sorted, null, 2), 'utf-8')
  console.log(`\n→ ${sorted.length} exercices (images OK)`)
}

async function main() {
  if (process.argv.includes('--filter-broken-images')) {
    await filterBrokenImages()
    return
  }
  if (process.argv.includes('--filter-only')) {
    filterExisting()
    return
  }

  const byId = new Map()

  // Charger l'existant pour reprendre (optionnel)
  if (existsSync(OUT_PATH)) {
    try {
      const existing = JSON.parse(readFileSync(OUT_PATH, 'utf-8'))
      if (Array.isArray(existing)) {
        existing.forEach((ex) => byId.set(ex.id, ex))
        console.log(`Reprise: ${byId.size} exos déjà en base\n`)
      }
    } catch {}
  }

  let totalScanned = 0
  let totalAdded = 0

  console.log(`Parcours du catalogue ExerciseDB (filtrage: muscu classique)`)
  console.log(`API: ${EXERCISEDB_BASE}\n`)

  totalScanned = await fetchAllExercisePages({
    delayMs: 1500,
    onPage: async ({ page, json }) => {
      let added = 0
      for (const raw of json.data) {
        if (!byId.has(raw.exerciseId) && isRelevant(raw)) {
          byId.set(raw.exerciseId, mapExercise(raw))
          added++
          totalAdded++
          console.log(`  + ${raw.name}`)
        }
      }

      if (added === 0) {
        process.stdout.write(`Page ${page}... ${byId.size} exos\n`)
      } else {
        mkdirSync(dirname(OUT_PATH), { recursive: true })
        const sorted = [...byId.values()].sort((a, b) =>
          a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
        )
        writeFileSync(OUT_PATH, JSON.stringify(sorted, null, 2), 'utf-8')
      }
    },
  })

  const final = [...byId.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
  )
  writeFileSync(OUT_PATH, JSON.stringify(final, null, 2), 'utf-8')

  console.log(`\n→ ${final.length} exercices classiques dans ${OUT_PATH}`)
  console.log(`   (${totalScanned} scannés, ${totalAdded} ajoutés ce run)`)
  console.log('\nPour activer: npm run catalog:use-filtered')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
