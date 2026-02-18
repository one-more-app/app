/**
 * Script pour récupérer tous les noms d'exercices de l'API ExerciseDB
 * Usage: node scripts/fetch-all-exercises.js
 */

const BASE = 'https://www.exercisedb.dev/api/v1'

async function fetchAll() {
  const names = new Set()
  let offset = 0
  const limit = 100

  while (true) {
    const res = await fetch(`${BASE}/exercises?limit=${limit}&offset=${offset}`)
    const json = await res.json()
    if (!json.success || !Array.isArray(json.data)) {
      console.error('API error:', json)
      break
    }
    for (const ex of json.data) {
      if (ex?.name) names.add(ex.name.trim())
    }
    if (json.data.length < limit) break
    offset += limit
    await new Promise(r => setTimeout(r, 5000))
  }

  return [...names].sort((a, b) => a.localeCompare(b, 'en'))
}

fetchAll()
  .then((names) => {
    const fs = require('fs')
    const out = process.cwd() + '/scripts/all-exercises.json'
    fs.writeFileSync(out, JSON.stringify(names))
    console.error('Total:', names.length)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
