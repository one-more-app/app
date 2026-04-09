import { CelebrationShareCard } from '@/components/share/CelebrationShareCard'
import type { CelebrationShareOpen } from '@/components/share/CelebrationShareCard'
import { UI } from '@/lib/translations'
import { toBlob } from 'html-to-image'
import { createRoot } from 'react-dom/client'

export type { CelebrationShareOpen }

async function waitForShareCardAssets(container: HTMLElement): Promise<void> {
  await document.fonts.ready
  const imgs = [...container.querySelectorAll('img')]
  await Promise.all(
    imgs.map(
      (img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise<void>((res) => {
              img.addEventListener('load', () => res(), { once: true })
              img.addEventListener('error', () => res(), { once: true })
            }),
    ),
  )
  await new Promise<void>((res) =>
    requestAnimationFrame(() => requestAnimationFrame(() => res())),
  )
}

export async function createCelebrationShareBlob(
  open: CelebrationShareOpen,
  isDark: boolean,
): Promise<Blob> {
  const host = document.createElement('div')
  host.style.cssText =
    'position:fixed;left:-16000px;top:0;z-index:-9999;pointer-events:none'
  document.body.appendChild(host)

  const root = createRoot(host)

  try {
    root.render(<CelebrationShareCard open={open} isDark={isDark} />)
    await waitForShareCardAssets(host)

    const el = host.querySelector('[data-share-card-root]') as HTMLElement | null
    if (!el) throw new Error('CelebrationShareCard introuvable')

    const blob = await toBlob(el, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: 'transparent',
    })
    if (!blob) throw new Error('toBlob')
    return blob
  } finally {
    root.unmount()
    host.remove()
  }
}

export async function shareCelebrationPng(
  open: CelebrationShareOpen,
  isDark: boolean,
): Promise<'shared' | 'downloaded'> {
  const blob = await createCelebrationShareBlob(open, isDark)
  const file = new File([blob], 'one-more.png', { type: 'image/png' })
  const text =
    open.kind === 'league'
      ? `${UI.leaguePromotionCelebrationTitle} · ${open.payload.exerciseName}`
      : `${UI.newRecordCelebrationTitle} · ${open.payload.exerciseName}`
  const data: ShareData = { title: 'One More', text, files: [file] }

  if (typeof navigator !== 'undefined' && navigator.canShare?.(data)) {
    await navigator.share(data)
    return 'shared'
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `one-more-${Date.now()}.png`
  a.click()
  URL.revokeObjectURL(url)
  return 'downloaded'
}
