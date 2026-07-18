import { yieldToMain } from '@/lib/yield-to-main'

const NATIVE_SHARE_ATTR = 'data-native-share-active'

/**
 * Masque les overlays web (Dialog Radix z-200) le temps que iOS présente
 * UIActivityViewController — évite le deadlock Capacitor Share + modale célébration.
 */
export async function prepareNativeSharePresentation(): Promise<() => void> {
  if (typeof document === 'undefined') return () => {}

  document.documentElement.setAttribute(NATIVE_SHARE_ATTR, 'true')
  await yieldToMain()
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
  await yieldToMain()
  // Laisse le main thread digérer le teardown DOM / replay avant le bridge natif.
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 50)
  })

  return () => {
    document.documentElement.removeAttribute(NATIVE_SHARE_ATTR)
  }
}
