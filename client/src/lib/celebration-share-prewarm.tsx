import { CelebrationShareCard } from '@/components/share/CelebrationShareCard'
import type { CelebrationShareOpen } from '@/components/share/CelebrationShareCard'
import { captureShareElement } from '@/lib/celebration-share-capture'
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
): Promise<CelebrationShareOpen> {
  if (open.kind !== 'league' && open.kind !== 'record') return open
  const dataUrl = await resolveShareImageAsDataUrl(
    open.payload.exerciseImageUrl,
    'square',
  )
  if (!dataUrl) return open
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
): Promise<Blob> {
  // UNIQUEMENT au tap Partager (jamais à l’open modale).
  // yieldToMain entre étapes pour ne pas geler Continuer si l’UI est encore visible.
  await yieldToMain()
  const openForCapture = await embedExerciseImageForCapture(open)
  await yieldToMain()
  await preloadShareImage(resolvePublicAssetUrl('logo-white-text.png'))
  await yieldToMain()
  const host = ensureRenderHost(openForCapture, isDark, key)
  const el = await waitForShareCardRoot(host)
  await yieldToMain()
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )
  await yieldToMain()
  return captureShareElement(el, isDark)
}

export function prewarmCelebrationShare(
  open: CelebrationShareOpen,
  isDark: boolean,
): void {
  const key = celebrationShareCacheKey(open, isDark)
  if (cache?.key === key && cache.blob) return
  if (cache?.key === key) return

  const promise = generateBlob(open, isDark, key)
    .then((blob) => {
      if (cache?.key === key) cache.blob = blob
      return blob
    })
    .catch((error) => {
      if (cache?.key === key) cache = null
      throw error
    })

  cache = { key, blob: null, promise }
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
): Promise<Blob> {
  const key = celebrationShareCacheKey(open, isDark)
  if (cache?.key === key && cache.blob) return cache.blob
  if (cache?.key === key) return cache.promise

  prewarmCelebrationShare(open, isDark)
  if (!cache) throw new Error('Échec du préchargement partage')
  return cache.promise
}

export function invalidateCelebrationShareCache(): void {
  cache = null
  teardownRenderHost()
}

registerCelebrationShareCacheInvalidator(invalidateCelebrationShareCache)
