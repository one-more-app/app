const CACHE_PREFIX = 'one-more-api-cache:'
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 1 semaine

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

function getCacheKey(endpoint: string, params?: Record<string, string | number>): string {
  const base = endpoint.replace(/\//g, ':').replace(/^:/, '')
  if (!params || Object.keys(params).length === 0) {
    return `${CACHE_PREFIX}${base}`
  }
  // Exclure undefined/null et trier pour garantir une clé unique par combinaison
  const sortedParams = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
  if (sortedParams.length === 0) {
    return `${CACHE_PREFIX}${base}`
  }
  const paramsStr = sortedParams
    .map(([k, v]) => `${k}=${String(v)}`)
    .join('&')
  return `${CACHE_PREFIX}${base}:${paramsStr}`
}

export function getFromCache<T>(endpoint: string, params?: Record<string, string | number>): T | null {
  try {
    const key = getCacheKey(endpoint, params)
    const raw = localStorage.getItem(key)
    if (!raw) return null

    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

export function setInCache<T>(
  endpoint: string,
  data: T,
  params?: Record<string, string | number>
): void {
  try {
    const key = getCacheKey(endpoint, params)
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + TTL_MS,
    }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // ignore storage errors
  }
}
