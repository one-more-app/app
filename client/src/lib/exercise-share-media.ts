/**
 * URLs d’assets pour capture (html-to-image / canvas) avec CORS correct.
 */

export type ShareImageAspect = 'square' | 'landscape'

export function resolvePublicAssetUrl(file: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const path = base.endsWith('/')
    ? `${base}${file.replace(/^\//, '')}`
    : `${base}/${file.replace(/^\//, '')}`
  if (typeof window === 'undefined') return path
  return new URL(path, window.location.href).href
}

function looksLikeGifUrl(href: string): boolean {
  return /\.gif(\?|#|$|&)/i.test(href)
}

/**
 * URL pour `<img crossOrigin="anonymous">` : proxy CORS si hébergeur externe (ex. ExerciseDB).
 * `square` : PNG 1080×1080 pour capture rapide en carte 1:1.
 * `landscape` : format historique paysage.
 */
export function getShareableExerciseImageUrl(
  raw: string | undefined,
  aspect: ShareImageAspect = 'landscape',
): string | undefined {
  const u = raw?.trim()
  if (!u) return undefined
  if (/^data:/i.test(u)) return u
  if (typeof window === 'undefined') return u

  try {
    const abs =
      u.startsWith('http://') || u.startsWith('https://')
        ? u
        : new URL(u, window.location.href).href
    if (new URL(abs).origin === window.location.origin) return abs

    if (aspect === 'square') {
      return `https://wsrv.nl/?url=${encodeURIComponent(abs)}&w=1080&h=1080&fit=cover&output=png`
    }

    if (looksLikeGifUrl(abs)) {
      return `https://wsrv.nl/?url=${encodeURIComponent(abs)}&w=960&h=960&fit=contain&output=gif`
    }
    return `https://wsrv.nl/?url=${encodeURIComponent(abs)}&w=1800&h=1200&fit=cover&output=png`
  } catch {
    return u
  }
}

export function preloadShareImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    const done = () => resolve()
    img.addEventListener('load', done, { once: true })
    img.addEventListener('error', done, { once: true })
    img.src = src
  })
}
