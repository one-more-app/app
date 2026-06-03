/**
 * Récupère tous les exercices ExerciseDB (sans filtrage de pertinence).
 * Sortie : api/data/popular-exercises.all.json
 *
 * Usage:
 *   npm run fetch:all-exercises
 *   npm run catalog:use-all
 *   npm run seed:exercises:replace
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
const OUT_PATH = join(__dirname, '../data/popular-exercises.all.json')

function isValid(raw) {
  return Boolean(raw?.exerciseId && raw?.name?.trim())
}

async function main() {
  const byId = new Map()

  if (existsSync(OUT_PATH)) {
    try {
      const existing = JSON.parse(readFileSync(OUT_PATH, 'utf-8'))
      if (Array.isArray(existing)) {
        existing.forEach((ex) => byId.set(ex.id, ex))
        console.log(`Reprise: ${byId.size} exos déjà en base\n`)
      }
    } catch {
      // ignore
    }
  }

  console.log(`Parcours complet du catalogue ExerciseDB (sans filtrage)`)
  console.log(`API: ${EXERCISEDB_BASE}\n`)

  const totalScanned = await fetchAllExercisePages({
    onPage: async ({ page, json, totalScanned }) => {
      let added = 0
      for (const raw of json.data) {
        if (!isValid(raw)) continue
        if (!byId.has(raw.exerciseId)) {
          byId.set(raw.exerciseId, mapExercise(raw))
          added++
        }
      }

      process.stdout.write(`Page ${page}... ${byId.size} exos (+${added})\n`)

      mkdirSync(dirname(OUT_PATH), { recursive: true })
      const sorted = [...byId.values()].sort((a, b) =>
        a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
      )
      writeFileSync(OUT_PATH, JSON.stringify(sorted, null, 2), 'utf-8')
    },
  })

  const final = [...byId.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
  )
  writeFileSync(OUT_PATH, JSON.stringify(final, null, 2), 'utf-8')

  console.log(`\n→ ${final.length} exercices dans ${OUT_PATH}`)
  console.log(`   (${totalScanned} scannés ce run)`)
  console.log('\nProchaines étapes:')
  console.log('  npm run catalog:use-all')
  console.log('  npm run seed:exercises:replace')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
