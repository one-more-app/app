import { CelebrationShareCard } from '@/components/share/CelebrationShareCard'
import type { CelebrationShareOpen } from '@/components/share/CelebrationShareCard'
import { captureShareElement } from '@/lib/celebration-share-capture'
import {
  getShareableExerciseImageUrl,
  preloadShareImage,
  resolvePublicAssetUrl,
} from '@/lib/exercise-share-media'
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

async function preloadCelebrationShareAssets(
  open: CelebrationShareOpen,
): Promise<void> {
  const tasks: Promise<void>[] = [
    preloadShareImage(resolvePublicAssetUrl('logo-white-text.png')),
  ]

  if (open.kind === 'league' || open.kind === 'record') {
    const url = getShareableExerciseImageUrl(
      open.payload.exerciseImageUrl,
      'square',
    )
    if (url) tasks.push(preloadShareImage(url))
  }

  await Promise.all(tasks)
}

async function generateBlob(
  open: CelebrationShareOpen,
  isDark: boolean,
  key: string,
): Promise<Blob> {
  await preloadCelebrationShareAssets(open)
  const host = ensureRenderHost(open, isDark, key)
  const el = host.querySelector('[data-share-card-root]') as HTMLElement | null
  if (!el) throw new Error('CelebrationShareCard introuvable')
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
