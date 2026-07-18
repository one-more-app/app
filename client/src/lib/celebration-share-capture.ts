import { toBlob } from 'html-to-image'
import type { ShareTrace } from '@/lib/celebration-share-debug'
import { yieldToMain } from '@/lib/yield-to-main'

/** Timeout max par image (réseau / wsrv) — trop bas → vignette exo vide dans le PNG. */
const IMAGE_TIMEOUT_MS = 10_000

async function waitForImage(
  img: HTMLImageElement,
  trace?: ShareTrace,
  index = 0,
): Promise<void> {
  trace?.log('waitForImage:begin', {
    index,
    complete: img.complete,
    srcKind: img.src.startsWith('data:')
      ? 'data'
      : img.src.includes('wsrv.nl')
        ? 'wsrv'
        : 'other',
    decoding: img.decoding,
  })
  if (!img.complete) {
    const loadT0 = Date.now()
    await new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer)
        resolve()
      }
      const timer = window.setTimeout(done, IMAGE_TIMEOUT_MS)
      img.addEventListener('load', done, { once: true })
      img.addEventListener('error', done, { once: true })
    })
    trace?.log('waitForImage:load-event', {
      index,
      loadWaitMs: Date.now() - loadT0,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    })
  }
  if (img.naturalWidth > 0 && typeof img.decode === 'function') {
    const decodeT0 = Date.now()
    try {
      await img.decode()
      trace?.log('waitForImage:decode-done', {
        index,
        decodeMs: Date.now() - decodeT0,
      })
    } catch (error) {
      trace?.log('waitForImage:decode-error', {
        index,
        decodeMs: Date.now() - decodeT0,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}

export async function waitForShareCaptureReady(
  container: HTMLElement,
  trace?: ShareTrace,
): Promise<void> {
  const fontsT0 = Date.now()
  await document.fonts.ready
  trace?.log('capture:fonts-ready', {
    fontsMs: Date.now() - fontsT0,
    fontCount: document.fonts.size,
  })

  const imgs = [...container.querySelectorAll('img')]
  trace?.log('capture:images-found', { count: imgs.length })
  if (imgs.length > 0) {
    const imgsT0 = Date.now()
    await Promise.all(imgs.map((img, index) => waitForImage(img, trace, index)))
    trace?.log('capture:images-ready', { imagesMs: Date.now() - imgsT0 })
  }

  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )
}

export async function captureShareElement(
  el: HTMLElement,
  isDark: boolean,
  trace?: ShareTrace,
): Promise<Blob> {
  await waitForShareCaptureReady(el, trace)
  await yieldToMain()
  trace?.log('capture:toBlob-start', {
    isDark,
    elSize: `${el.offsetWidth}x${el.offsetHeight}`,
  })
  const toBlobT0 = Date.now()
  const blob = await toBlob(el, {
    pixelRatio: 1,
    cacheBust: false,
    backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
  })
  trace?.log('capture:toBlob-done', {
    toBlobMs: Date.now() - toBlobT0,
    ok: !!blob,
    blobBytes: blob?.size ?? 0,
  })
  if (!blob) throw new Error('toBlob')
  return blob
}
