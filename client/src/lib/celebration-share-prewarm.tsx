import { CelebrationShareCard } from '@/components/share/CelebrationShareCard'
import type { CelebrationShareOpen } from '@/components/share/CelebrationShareCard'
import { captureShareElement } from '@/lib/celebration-share-capture'
import { createShareTrace, type ShareTrace } from '@/lib/celebration-share-debug'
import { registerCelebrationShareCacheInvalidator } from '@/lib/celebration-share-cache-control'
import {
  preloadShareImage,
  resolvePublicAssetUrl,
  resolveShareImageAsDataUrl,
} from '@/lib/exercise-share-media'
import { yieldToMain } from '@/lib/yield-to-main'
import { createRoot, type Root } from 'react-dom/client'

type CacheEntry = {
  key: string
  blob: Blob | null
  promise: Promise<Blob>
}

let cache: CacheEntry | null = null

let renderHost: {
  key: string
  host: HTMLDivElement
  root: Root
} | null = null

function celebrationShareCacheKey(
  open: CelebrationShareOpen,
  isDark: boolean,
): string {
  return JSON.stringify({ kind: open.kind, payload: open.payload, isDark })
}

function teardownRenderHost(): void {
  if (!renderHost) return
  renderHost.root.unmount()
  renderHost.host.remove()
  renderHost = null
}

function ensureRenderHost(
  open: CelebrationShareOpen,
  isDark: boolean,
  key: string,
): HTMLDivElement {
  if (renderHost?.key === key) {
    renderHost.root.render(<CelebrationShareCard open={open} isDark={isDark} />)
    return renderHost.host
  }

  teardownRenderHost()

  const host = document.createElement('div')
  host.style.cssText =
    'position:fixed;left:-12000px;top:0;z-index:-9999;pointer-events:none'
  document.body.appendChild(host)
  const root = createRoot(host)
  root.render(<CelebrationShareCard open={open} isDark={isDark} />)
  renderHost = { key, host, root }
  return host
}

async function embedExerciseImageForCapture(
  open: CelebrationShareOpen,
  trace: ShareTrace,
): Promise<CelebrationShareOpen> {
  if (open.kind !== 'league' && open.kind !== 'record') {
    trace.log('embedExerciseImage:skip', { kind: open.kind })
    return open
  }
  trace.log('embedExerciseImage:begin', {
    kind: open.kind,
    hasExerciseImageUrl: !!open.payload.exerciseImageUrl,
  })
  const dataUrl = await resolveShareImageAsDataUrl(
    open.payload.exerciseImageUrl,
    'square',
    trace,
  )
  if (!dataUrl) {
    trace.log('embedExerciseImage:no-data-url')
    return open
  }
  trace.log('embedExerciseImage:embedded', { dataUrlChars: dataUrl.length })
  return {
    ...open,
    payload: {
      ...open.payload,
      exerciseImageUrl: dataUrl,
    },
  }
}

async function waitForShareCardRoot(host: HTMLElement): Promise<HTMLElement> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const el = host.querySelector('[data-share-card-root]') as HTMLElement | null
    if (el) return el
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    )
  }
  throw new Error('CelebrationShareCard introuvable')
}

async function generateBlob(
  open: CelebrationShareOpen,
  isDark: boolean,
  key: string,
  trace: ShareTrace,
): Promise<Blob> {
  trace.log('generateBlob:begin', { kind: open.kind, isDark, cacheKeyLen: key.length })
  // UNIQUEMENT au tap Partager (jamais à l’open modale).
  // yieldToMain entre étapes pour ne pas geler Continuer si l’UI est encore visible.
  await yieldToMain()
  trace.log('generateBlob:after-yield-1')
  const openForCapture = await embedExerciseImageForCapture(open, trace)
  await yieldToMain()
  trace.log('generateBlob:after-yield-2')
  const logoUrl = resolvePublicAssetUrl('logo-white-text.png')
  trace.log('generateBlob:preload-logo-start', { logoUrl })
  const logoT0 = Date.now()
  await preloadShareImage(logoUrl)
  trace.log('generateBlob:preload-logo-done', { logoMs: Date.now() - logoT0 })
  await yieldToMain()
  trace.log('generateBlob:after-yield-3')
  const host = ensureRenderHost(openForCapture, isDark, key)
  trace.log('generateBlob:render-host-mounted')
  const rootT0 = Date.now()
  const el = await waitForShareCardRoot(host)
  trace.log('generateBlob:share-card-root-ready', {
    rootWaitMs: Date.now() - rootT0,
    cardSize: `${el.offsetWidth}x${el.offsetHeight}`,
  })
  await yieldToMain()
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )
  await yieldToMain()
  trace.log('generateBlob:capture-start')
  const captureT0 = Date.now()
  const blob = await captureShareElement(el, isDark, trace)
  // Retirer la carte 1080 offscreen AVANT Share.share — sinon session replay
  // + gros DOM bloquent le main thread / la présentation iOS.
  teardownRenderHost()
  trace.log('generateBlob:render-host-teardown')
  trace.log('generateBlob:capture-done', {
    captureMs: Date.now() - captureT0,
    blobBytes: blob.size,
    blobType: blob.type,
  })
  return blob
}

export function prewarmCelebrationShare(
  open: CelebrationShareOpen,
  isDark: boolean,
  trace?: ShareTrace,
): void {
  const key = celebrationShareCacheKey(open, isDark)
  if (cache?.key === key && cache.blob) {
    trace?.log('prewarm:cache-hit-blob')
    return
  }
  if (cache?.key === key) {
    trace?.log('prewarm:cache-hit-promise')
    return
  }

  const activeTrace =
    trace ?? createShareTrace('generateBlob', { kind: open.kind, isDark })

  const promise = generateBlob(open, isDark, key, activeTrace)
    .then((blob) => {
      activeTrace.log('generateBlob:success', { blobBytes: blob.size })
      if (cache?.key === key) cache.blob = blob
      return blob
    })
    .catch((error) => {
      activeTrace.log('generateBlob:error', {
        error: error instanceof Error ? error.message : String(error),
      })
      if (cache?.key === key) cache = null
      throw error
    })

  cache = { key, blob: null, promise }
  activeTrace.log('prewarm:started')
}

export function isCelebrationShareReady(
  open: CelebrationShareOpen,
  isDark: boolean,
): boolean {
  const key = celebrationShareCacheKey(open, isDark)
  return cache?.key === key && cache.blob !== null
}

export async function getCelebrationShareBlob(
  open: CelebrationShareOpen,
  isDark: boolean,
  trace?: ShareTrace,
): Promise<Blob> {
  const key = celebrationShareCacheKey(open, isDark)
  if (cache?.key === key && cache.blob) {
    trace?.log('getBlob:cache-hit-blob', { blobBytes: cache.blob.size })
    return cache.blob
  }
  if (cache?.key === key) {
    trace?.log('getBlob:cache-hit-promise')
    return cache.promise
  }

  prewarmCelebrationShare(open, isDark, trace)
  if (!cache) throw new Error('Échec du préchargement partage')
  return cache.promise
}

export function invalidateCelebrationShareCache(): void {
  cache = null
  teardownRenderHost()
}

/** Nettoie le DOM offscreen (ex. avant Share.share si blob déjà en cache). */
export function releaseCelebrationShareRenderHost(): void {
  teardownRenderHost()
}

/** Précharge blob + plugins natifs (useEffect différé sur modale célébration). */
export async function warmCelebrationShareAmbient(
  open: CelebrationShareOpen,
  isDark: boolean,
): Promise<void> {
  prewarmCelebrationShare(open, isDark)
  const { Capacitor } = await import('@capacitor/core')
  if (Capacitor.isNativePlatform()) {
    await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ])
  }
}

registerCelebrationShareCacheInvalidator(invalidateCelebrationShareCache)
