/**
 * URLs d’assets pour capture (html-to-image / canvas).
 * Les images externes doivent être embarquées en data-URL avant capture —
 * sinon html-to-image laisse un carré vide (CORS / WKWebView).
 */

import type { ShareTrace } from '@/lib/celebration-share-debug'

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
 * URL proxy CORS pour affichage / fetch.
 * `square` : PNG compact pour la vignette story (pas besoin de 1080).
 */
export function getShareableExerciseImageUrl(
  raw: string | undefined,
  aspect: ShareImageAspect = 'landscape',
): string | undefined {
  const u = raw?.trim()
  if (!u) return undefined
  if (/^data:/i.test(u)) return u
  if (/^blob:/i.test(u)) return u
  if (typeof window === 'undefined') return u

  try {
    const abs =
      u.startsWith('http://') || u.startsWith('https://')
        ? u
        : new URL(u, window.location.href).href
    if (new URL(abs).origin === window.location.origin) return abs

    if (aspect === 'square') {
      // 512 suffit pour size-56 sur carte 1080 — plus rapide au Partager.
      return `https://wsrv.nl/?url=${encodeURIComponent(abs)}&w=512&h=512&fit=cover&output=png`
    }

    if (looksLikeGifUrl(abs)) {
      return `https://wsrv.nl/?url=${encodeURIComponent(abs)}&w=960&h=960&fit=contain&output=gif`
    }
    return `https://wsrv.nl/?url=${encodeURIComponent(abs)}&w=1800&h=1200&fit=cover&output=png`
  } catch {
    return u
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('readAsDataURL'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('readAsDataURL'))
    reader.readAsDataURL(blob)
  })
}

function loadImageAsDataUrl(src: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    const timer = window.setTimeout(() => resolve(undefined), 12_000)
    img.onload = () => {
      clearTimeout(timer)
      if (img.naturalWidth <= 0) {
        resolve(undefined)
        return
      }
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(undefined)
          return
        }
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch {
        resolve(undefined)
      }
    }
    img.onerror = () => {
      clearTimeout(timer)
      resolve(undefined)
    }
    img.src = src
  })
}

/**
 * Embarque l’image exo en data-URL pour html-to-image (appelé au tap Partager uniquement).
 */
export async function resolveShareImageAsDataUrl(
  raw: string | undefined,
  aspect: ShareImageAspect = 'square',
  trace?: ShareTrace,
): Promise<string | undefined> {
  const url = getShareableExerciseImageUrl(raw, aspect)
  trace?.log('resolveShareImage:begin', {
    hasRaw: !!raw,
    aspect,
    urlKind: url
      ? /^data:/i.test(url)
        ? 'data'
        : url.includes('wsrv.nl')
          ? 'wsrv'
          : 'other'
      : 'none',
  })
  if (!url) return undefined
  if (/^data:/i.test(url)) {
    trace?.log('resolveShareImage:already-data-url', {
      dataUrlChars: url.length,
    })
    return url
  }

  try {
    trace?.log('resolveShareImage:fetch-start', { url: url.slice(0, 120) })
    const fetchT0 = Date.now()
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
    trace?.log('resolveShareImage:fetch-response', {
      fetchMs: Date.now() - fetchT0,
      ok: res.ok,
      status: res.status,
    })
    if (res.ok) {
      const blobT0 = Date.now()
      const blob = await res.blob()
      trace?.log('resolveShareImage:blob-ready', {
        blobMs: Date.now() - blobT0,
        blobBytes: blob.size,
        blobType: blob.type,
      })
      if (blob.size > 0) {
        const dataT0 = Date.now()
        const dataUrl = await blobToDataUrl(blob)
        trace?.log('resolveShareImage:blob-to-dataurl-done', {
          dataUrlMs: Date.now() - dataT0,
          dataUrlChars: dataUrl.length,
        })
        return dataUrl
      }
    }
  } catch (error) {
    trace?.log('resolveShareImage:fetch-error', {
      error: error instanceof Error ? error.message : String(error),
    })
    /* fallback canvas */
  }

  trace?.log('resolveShareImage:canvas-fallback-start')
  const fallbackT0 = Date.now()
  const fallback = await loadImageAsDataUrl(url)
  trace?.log('resolveShareImage:canvas-fallback-done', {
    fallbackMs: Date.now() - fallbackT0,
    ok: !!fallback,
    dataUrlChars: fallback?.length ?? 0,
  })
  return fallback
}

export function preloadShareImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    const done = () => resolve()
    const timer = window.setTimeout(done, 10_000)
    img.addEventListener(
      'load',
      () => {
        clearTimeout(timer)
        done()
      },
      { once: true },
    )
    img.addEventListener(
      'error',
      () => {
        clearTimeout(timer)
        done()
      },
      { once: true },
    )
    img.src = src
  })
}
