import type { ExerciseDBExercise } from '@/types'
import { getFromCache, setInCache } from '@/lib/api-cache'
import { EXERCISE_NAMES } from '@/lib/exercise-translations'

const BASE_URL = 'https://www.exercisedb.dev/api/v1'

/** Équipements exclusivement cardio (vélo, elliptique, stepper, corde à sauter, etc.) */
export const CARDIO_EQUIPMENT = new Set([
  'stationary bike',
  'stepmill machine',
  'elliptical machine',
  'skierg machine',
  'upper body ergometer',
  'rope',
])

/** Exercices populaires = ceux qu'on a traduits (les plus courants) */
const POPULAR_EXERCISE_NAMES = new Set(Object.keys(EXERCISE_NAMES))

interface ApiResponse<T> {
  success: boolean
  data: T
  metadata?: {
    totalExercises: number
    totalPages: number
  }
}

async function fetchApi<T>(
  endpoint: string,
  params?: Record<string, string | number>
): Promise<T> {
  const searchParams = params
    ? '?' +
      new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).map(([k, v]) => [k, String(v)])
        )
      )
    : ''
  const res = await fetch(`${BASE_URL}${endpoint}${searchParams}`)

  if (!res.ok) {
    throw new Error(`ExerciseDB API: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

// v1 API returns { exerciseId, name, gifUrl, targetMuscles[], bodyParts[], equipments[], ... }
function mapExercise(raw: {
  exerciseId: string
  name: string
  gifUrl: string
  targetMuscles: string[]
  bodyParts: string[]
  equipments: string[]
  secondaryMuscles?: string[]
  instructions?: string[]
}): ExerciseDBExercise {
  return {
    id: raw.exerciseId,
    name: raw.name,
    bodyPart: raw.bodyParts?.[0] ?? '',
    target: raw.targetMuscles?.[0] ?? '',
    equipment: raw.equipments?.[0] ?? '',
    secondaryMuscles: raw.secondaryMuscles ?? [],
    instructions: raw.instructions ?? [],
    gifUrl: raw.gifUrl,
  }
}

export async function fetchExercises(
  limit = 25,
  offset = 0,
  search = '',
  equipment = ''
): Promise<ExerciseDBExercise[]> {
  const params: Record<string, string | number> = { limit, offset }
  if (search) params.search = search
  if (equipment) params.equipment = equipment

  const cacheKey = `/exercises`
  const cached = getFromCache<ExerciseDBExercise[]>(cacheKey, params)
  if (cached) return cached

  const res = equipment
    ? await fetchApi<ApiResponse<unknown[]>>('/exercises/filter', params)
    : await fetchApi<ApiResponse<unknown[]>>('/exercises', params)
  const list = Array.isArray(res.data) ? res.data : []
  const exercises = list.map((item) =>
    mapExercise(item as Parameters<typeof mapExercise>[0])
  )

  setInCache(cacheKey, exercises, params)
  return exercises
}

export async function fetchExerciseById(
  id: string
): Promise<ExerciseDBExercise | null> {
  const cacheKey = `/exercises/${id}`
  const cached = getFromCache<ExerciseDBExercise>(cacheKey)
  if (cached) return cached

  try {
    const res = await fetchApi<ApiResponse<unknown>>(`/exercises/${id}`)
    const data = res.data
      ? mapExercise(res.data as Parameters<typeof mapExercise>[0])
      : null
    if (data) setInCache(cacheKey, data)
    return data
  } catch {
    return null
  }
}

export async function fetchExercisesFiltered(
  bodyPart: string,
  search: string,
  limit = 25,
  offset = 0,
  equipment = ''
): Promise<ExerciseDBExercise[]> {
  const params: Record<string, string | number> = {
    limit,
    offset,
    bodyParts: bodyPart,
    search: search.trim(),
  }
  if (equipment) params.equipment = equipment

  const cacheKey = `/exercises/filter`
  const cached = getFromCache<ExerciseDBExercise[]>(cacheKey, params)
  if (cached) return cached

  const res = await fetchApi<ApiResponse<unknown[]>>('/exercises/filter', params)
  const list = Array.isArray(res.data) ? res.data : []
  const exercises = list.map((item) =>
    mapExercise(item as Parameters<typeof mapExercise>[0])
  )

  setInCache(cacheKey, exercises, params)
  return exercises
}

/** Filtre par muscle cible (ex: biceps, triceps, quadriceps) via l'endpoint /exercises/filter */
export async function fetchExercisesByTarget(
  target: string,
  limit = 25,
  offset = 0,
  equipment = ''
): Promise<ExerciseDBExercise[]> {
  const params: Record<string, string | number> = {
    limit,
    offset,
    muscles: target,
  }
  if (equipment) params.equipment = equipment

  const cacheKey = `/exercises/filter`
  const cached = getFromCache<ExerciseDBExercise[]>(cacheKey, params)
  if (cached) return cached

  const res = await fetchApi<ApiResponse<unknown[]>>('/exercises/filter', params)
  const list = Array.isArray(res.data) ? res.data : []
  const exercises = list.map((item) =>
    mapExercise(item as Parameters<typeof mapExercise>[0])
  )

  setInCache(cacheKey, exercises, params)
  return exercises
}

/** Filtre par muscle cible + recherche via l'endpoint /exercises/filter */
export async function fetchExercisesFilteredByTarget(
  target: string,
  search: string,
  limit = 25,
  offset = 0,
  equipment = ''
): Promise<ExerciseDBExercise[]> {
  const params: Record<string, string | number> = {
    limit,
    offset,
    muscles: target,
    search: search.trim(),
  }
  if (equipment) params.equipment = equipment

  const cacheKey = `/exercises/filter`
  const cached = getFromCache<ExerciseDBExercise[]>(cacheKey, params)
  if (cached) return cached

  const res = await fetchApi<ApiResponse<unknown[]>>('/exercises/filter', params)
  const list = Array.isArray(res.data) ? res.data : []
  const exercises = list.map((item) =>
    mapExercise(item as Parameters<typeof mapExercise>[0])
  )

  setInCache(cacheKey, exercises, params)
  return exercises
}

export async function fetchExercisesByBodyPart(
  bodyPart: string,
  limit = 25,
  offset = 0,
  equipment = ''
): Promise<ExerciseDBExercise[]> {
  if (equipment) {
    return fetchExercisesFiltered(bodyPart, '', limit, offset, equipment)
  }
  const encoded = encodeURIComponent(bodyPart)
  const params = { limit, offset }
  const cacheKey = `/bodyparts/${encoded}/exercises`

  const cached = getFromCache<ExerciseDBExercise[]>(cacheKey, params)
  if (cached) return cached

  const res = await fetchApi<ApiResponse<unknown[]>>(
    `/bodyparts/${encoded}/exercises`,
    params
  )
  const list = Array.isArray(res.data) ? res.data : []
  const exercises = list.map((item) =>
    mapExercise(item as Parameters<typeof mapExercise>[0])
  )

  setInCache(cacheKey, exercises, params)
  return exercises
}

export async function fetchBodyPartList(): Promise<string[]> {
  const cacheKey = '/bodyparts'
  const cached = getFromCache<string[]>(cacheKey)
  if (cached) return cached

  const res = await fetchApi<ApiResponse<{ name: string }[]>>('/bodyparts')
  const list = Array.isArray(res.data)
    ? res.data.map((item) => item.name)
    : []
  setInCache(cacheKey, list)
  return list
}

export async function fetchMuscleList(): Promise<string[]> {
  const cacheKey = '/muscles'
  const cached = getFromCache<string[]>(cacheKey)
  if (cached) return cached

  const res = await fetchApi<ApiResponse<{ name: string }[]>>('/muscles')
  const list = Array.isArray(res.data)
    ? res.data
        .map((item) => item.name)
        .filter((m) => m !== 'cardio')
        .sort((a, b) => a.localeCompare(b))
    : []
  setInCache(cacheKey, list)
  return list
}

export async function fetchEquipmentList(): Promise<string[]> {
  const cacheKey = '/equipments'
  const cached = getFromCache<string[]>(cacheKey)
  if (cached) return cached

  const res = await fetchApi<ApiResponse<{ name: string }[]>>('/equipments')
  const list = Array.isArray(res.data)
    ? res.data.map((item) => item.name)
    : []
  setInCache(cacheKey, list)
  return list
}

// v1 API provides gifUrl directly in each exercise - no API key needed
export function getExerciseImageUrl(gifUrl: string | undefined): string {
  return gifUrl ?? ''
}

/** Trie les exercices : populaires en premier, puis par nom */
export function sortExercisesByPopularity(
  exercises: ExerciseDBExercise[]
): ExerciseDBExercise[] {
  return [...exercises].sort((a, b) => {
    const aPopular = POPULAR_EXERCISE_NAMES.has(a.name.trim().toLowerCase())
    const bPopular = POPULAR_EXERCISE_NAMES.has(b.name.trim().toLowerCase())
    if (aPopular && !bPopular) return -1
    if (!aPopular && bPopular) return 1
    return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
  })
}
