import { toBlob } from 'html-to-image'
import { yieldToMain } from '@/lib/yield-to-main'

/** Timeout max par image (réseau / wsrv) — trop bas → vignette exo vide dans le PNG. */
const IMAGE_TIMEOUT_MS = 10_000

async function waitForImage(img: HTMLImageElement): Promise<void> {
  if (!img.complete) {
    await new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer)
        resolve()
      }
      const timer = window.setTimeout(done, IMAGE_TIMEOUT_MS)
      img.addEventListener('load', done, { once: true })
      img.addEventListener('error', done, { once: true })
    })
  }
  if (img.naturalWidth > 0 && typeof img.decode === 'function') {
    try {
      await img.decode()
    } catch {
      /* ignore */
    }
  }
}

export async function waitForShareCaptureReady(
  container: HTMLElement,
): Promise<void> {
  await document.fonts.ready

  const imgs = [...container.querySelectorAll('img')]
  if (imgs.length > 0) {
    await Promise.all(imgs.map((img) => waitForImage(img)))
  }

  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )
}

export async function captureShareElement(
  el: HTMLElement,
  isDark: boolean,
): Promise<Blob> {
  await waitForShareCaptureReady(el)
  await yieldToMain()

  const blob = await toBlob(el, {
    pixelRatio: 1,
    cacheBust: false,
    backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
  })
  if (!blob) throw new Error('toBlob')
  return blob
}
