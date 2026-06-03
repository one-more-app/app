/**
 * Helpers partagés pour récupérer le catalogue ExerciseDB (scripts npm).
 * API gratuite : https://oss.exercisedb.dev/api/v1
 */

export const EXERCISEDB_BASE =
  process.env.EXERCISEDB_BASE_URL ?? 'https://oss.exercisedb.dev/api/v1'

export const EXERCISEDB_PAGE_LIMIT = 25

export function mapExercise(raw) {
  return {
    id: raw.exerciseId,
    name: raw.name,
    bodyPart: raw.bodyParts?.[0] ?? '',
    target: raw.targetMuscles?.[0] ?? '',
    equipment: raw.equipments?.[0] ?? '',
    secondaryMuscles: raw.secondaryMuscles ?? [],
    instructions: raw.instructions ?? [],
    gifUrl: raw.gifUrl ?? '',
  }
}

export async function fetchWithRetry(url, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url)
    if (res.status === 429) {
      const wait = Math.pow(2, i) * 8000
      console.log(`  Rate limit → attente ${wait / 1000}s`)
      await new Promise((r) => setTimeout(r, wait))
      continue
    }
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(text.slice(0, 120))
    }
  }
  throw new Error('Rate limit: trop de tentatives')
}

export async function fetchAllExercisePages({
  onPage,
  delayMs = 1500,
} = {}) {
  let after
  let page = 1
  let totalScanned = 0

  while (true) {
    const params = new URLSearchParams({
      limit: String(EXERCISEDB_PAGE_LIMIT),
    })
    if (after) params.set('after', after)

    const url = `${EXERCISEDB_BASE}/exercises?${params.toString()}`
    const json = await fetchWithRetry(url)

    if (!json.success || !Array.isArray(json.data)) {
      throw new Error(`Erreur API ExerciseDB: ${JSON.stringify(json).slice(0, 200)}`)
    }

    totalScanned += json.data.length
    if (onPage) {
      await onPage({ page, json, totalScanned })
    }

    if (!json.meta?.hasNextPage || json.data.length === 0) break

    after = json.meta?.nextCursor
    if (!after) break

    page++
    await new Promise((r) => setTimeout(r, delayMs))
  }

  return totalScanned
}
