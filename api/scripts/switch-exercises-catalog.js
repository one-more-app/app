/**
 * Active un variant du catalogue exercices (copie vers popular-exercises.json).
 *
 * Usage:
 *   npm run catalog:use-all        # catalogue complet
 *   npm run catalog:use-filtered   # rollback vers la liste filtrée (569 exos)
 */

import { copyFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../data')
const ACTIVE_PATH = join(DATA_DIR, 'popular-exercises.json')

const VARIANTS = {
  filtered: join(DATA_DIR, 'popular-exercises.filtered.json'),
  all: join(DATA_DIR, 'popular-exercises.all.json'),
}

const variant = process.argv[2]

if (!variant || !VARIANTS[variant]) {
  console.error('Usage: node scripts/switch-exercises-catalog.js <filtered|all>')
  process.exit(1)
}

const source = VARIANTS[variant]

if (!existsSync(source)) {
  console.error(`Fichier introuvable: ${source}`)
  if (variant === 'all') {
    console.error('Exécute d’abord: npm run fetch:all-exercises')
  }
  process.exit(1)
}

copyFileSync(source, ACTIVE_PATH)
console.log(`Catalogue actif → ${variant}`)
console.log(`  ${source}`)
console.log(`  → ${ACTIVE_PATH}`)
console.log('\nRecharge la base:')
console.log('  npm run seed:exercises:replace        # dev (ts-node)')
console.log('  npm run seed:exercises:replace:prod   # prod (dist compilé)')
