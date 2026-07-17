import { toBlob } from 'html-to-image'

const IMAGE_FALLBACK_MS = 150

function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => resolve()
    img.addEventListener('load', done, { once: true })
    img.addEventListener('error', done, { once: true })
  })
}

export async function waitForShareCaptureReady(
  container: HTMLElement,
): Promise<void> {
  await document.fonts.ready

  const imgs = [...container.querySelectorAll('img')]
  if (imgs.length > 0) {
    await Promise.race([
      Promise.all(imgs.map((img) => waitForImage(img))),
      new Promise<void>((resolve) =>
        setTimeout(resolve, IMAGE_FALLBACK_MS * imgs.length),
      ),
    ])
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

  const blob = await toBlob(el, {
    pixelRatio: 1,
    cacheBust: false,
    backgroundColor: isDark ? '#0a0a0a' : '#ffffff',
  })
  if (!blob) throw new Error('toBlob')
  return blob
}
