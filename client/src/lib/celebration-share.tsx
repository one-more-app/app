import { CelebrationShareCard } from '@/components/share/CelebrationShareCard'
import type { CelebrationShareOpen } from '@/components/share/CelebrationShareCard'
import { UI } from '@/lib/translations'
import { toBlob } from 'html-to-image'
import { createRoot } from 'react-dom/client'

export type { CelebrationShareOpen }

const FONT_READY_MS = 250
const IMAGE_READY_MS = 600

function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => resolve()
    img.addEventListener('load', done, { once: true })
    img.addEventListener('error', done, { once: true })
  })
}

async function waitForShareReady(container: HTMLElement): Promise<void> {
  await Promise.race([
    document.fonts.ready,
    new Promise<void>((resolve) => setTimeout(resolve, FONT_READY_MS)),
  ])

  const imgs = [...container.querySelectorAll('img')]
  if (imgs.length > 0) {
    await Promise.race([
      Promise.all(imgs.map((img) => waitForImage(img))),
      new Promise<void>((resolve) => setTimeout(resolve, IMAGE_READY_MS)),
    ])
  }

  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  )
}

function shareText(open: CelebrationShareOpen): string {
  switch (open.kind) {
    case 'league':
      return `${UI.leaguePromotionCelebrationTitle} · ${open.payload.exerciseName}`
    case 'record':
      return `${UI.newRecordCelebrationTitle} · ${open.payload.exerciseName}`
    case 'streak':
      return open.payload.current === 1
        ? UI.streakSheetTitleFirstDay
        : UI.streakSheetTitleStreak.replace(
            '{days}',
            String(open.payload.current),
          )
    case 'levelup':
      return `${UI.levelUpCelebrationTitle} · ${UI.xpLevelLabel.replace('{level}', String(open.payload.level))}`
    default:
      return 'One More'
  }
}

export async function createCelebrationShareBlob(
  open: CelebrationShareOpen,
  isDark: boolean,
): Promise<Blob> {
  const host = document.createElement('div')
  host.style.cssText =
    'position:fixed;left:-12000px;top:0;z-index:-9999;pointer-events:none'
  document.body.appendChild(host)

  const root = createRoot(host)

  try {
    root.render(<CelebrationShareCard open={open} isDark={isDark} />)
    await waitForShareReady(host)

    const el = host.querySelector('[data-share-card-root]') as HTMLElement | null
    if (!el) throw new Error('CelebrationShareCard introuvable')

    const blob = await toBlob(el, {
      pixelRatio: 1.5,
      cacheBust: false,
      backgroundColor: isDark ? 'oklch(0.22 0 0)' : 'oklch(1 0 0)',
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
  const data: ShareData = {
    title: 'One More',
    text: shareText(open),
    files: [file],
  }

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
