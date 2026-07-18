import type { CelebrationShareOpen } from '@/components/share/CelebrationShareCard'
import { createShareTrace, type ShareTrace } from '@/lib/celebration-share-debug'
import {
  getCelebrationShareBlob,
  releaseCelebrationShareRenderHost,
} from '@/lib/celebration-share-prewarm'
import { prepareNativeSharePresentation } from '@/lib/native-share-presentation'
import { UI } from '@/lib/translations'
import { Capacitor } from '@capacitor/core'

export type { CelebrationShareOpen }

export type ShareCelebrationPresentation = {
  /** Ferme la modale web avant UIActivityViewController (iOS). */
  beforeNativeShare?: () => Promise<void>
  /** Rouvre la modale si la célébration est toujours active. */
  afterNativeShare?: () => void
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

function isShareCancelled(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /cancel/i.test(message)
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('readAsDataURL'))
        return
      }
      const base64 = result.split(',')[1]
      if (!base64) {
        reject(new Error('base64'))
        return
      }
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error ?? new Error('readAsDataURL'))
    reader.readAsDataURL(blob)
  })
}

async function shareBlobNative(
  blob: Blob,
  text: string,
  trace: ShareTrace,
  presentation?: ShareCelebrationPresentation,
): Promise<'shared'> {
  trace.log('native:import-plugins-start')
  const importT0 = Date.now()
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const { Share } = await import('@capacitor/share')
  trace.log('native:import-plugins-done', { importMs: Date.now() - importT0 })

  const fileName = `one-more-${Date.now()}.png`
  trace.log('native:blob-to-base64-start', { blobBytes: blob.size })
  const b64T0 = Date.now()
  const base64 = await blobToBase64(blob)
  trace.log('native:blob-to-base64-done', {
    b64Ms: Date.now() - b64T0,
    base64Chars: base64.length,
  })

  trace.log('native:write-file-start', { fileName })
  const writeT0 = Date.now()
  await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
  })
  trace.log('native:write-file-done', { writeMs: Date.now() - writeT0 })

  const { uri } = await Filesystem.getUri({
    directory: Directory.Cache,
    path: fileName,
  })
  trace.log('native:share-sheet-start', { uri: uri.slice(0, 80) })
  releaseCelebrationShareRenderHost()
  await presentation?.beforeNativeShare?.()
  const endNativeSharePrep = await prepareNativeSharePresentation()
  // Dialog Radix fermé + overlays retirés avant le bridge natif.
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 200)
  })
  const shareT0 = Date.now()
  try {
    await Share.share({
      title: 'One More',
      text,
      files: [uri],
      dialogTitle: UI.share,
    })
    trace.log('native:share-sheet-done', { shareMs: Date.now() - shareT0 })
  } finally {
    endNativeSharePrep()
    presentation?.afterNativeShare?.()
  }

  return 'shared'
}

async function shareBlobWeb(
  blob: Blob,
  text: string,
  trace: ShareTrace,
): Promise<'shared' | 'downloaded'> {
  trace.log('web:share-start', { blobBytes: blob.size })
  const file = new File([blob], 'one-more.png', { type: 'image/png' })
  const data: ShareData = {
    title: 'One More',
    text,
    files: [file],
  }

  if (typeof navigator !== 'undefined' && navigator.canShare?.(data)) {
    await navigator.share(data)
    trace.log('web:navigator-share-done')
    return 'shared'
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `one-more-${Date.now()}.png`
  a.click()
  URL.revokeObjectURL(url)
  trace.log('web:download-fallback-done')
  return 'downloaded'
}

export async function shareCelebrationPng(
  open: CelebrationShareOpen,
  isDark: boolean,
  presentation?: ShareCelebrationPresentation,
): Promise<'shared' | 'downloaded'> {
  const trace = createShareTrace('shareCelebrationPng', {
    kind: open.kind,
    isDark,
    hasExerciseImage:
      (open.kind === 'league' || open.kind === 'record') &&
      !!open.payload.exerciseImageUrl,
  })

  trace.log('tap:dynamic-import-start')
  const importT0 = Date.now()
  // Mesure séparée import chunks (déjà fait côté UI, mais log ici si appel direct).
  trace.log('tap:get-blob-start')
  const blobT0 = Date.now()
  const blob = await getCelebrationShareBlob(open, isDark, trace)
  trace.log('tap:get-blob-done', {
    blobMs: Date.now() - blobT0,
    blobBytes: blob.size,
    totalSinceImportMs: Date.now() - importT0,
  })

  const text = shareText(open)

  if (Capacitor.isNativePlatform()) {
    try {
      const result = await shareBlobNative(blob, text, trace, presentation)
      trace.log('tap:complete', { result, totalMs: trace.elapsedMs() })
      return result
    } catch (error) {
      trace.log('tap:native-error', {
        error: error instanceof Error ? error.message : String(error),
      })
      if (isShareCancelled(error)) {
        throw new DOMException('Share cancelled', 'AbortError')
      }
      const result = await shareBlobWeb(blob, text, trace)
      trace.log('tap:complete-web-fallback', { result, totalMs: trace.elapsedMs() })
      return result
    }
  }

  try {
    const result = await shareBlobWeb(blob, text, trace)
    trace.log('tap:complete', { result, totalMs: trace.elapsedMs() })
    return result
  } catch (error) {
    trace.log('tap:web-error', {
      error: error instanceof Error ? error.message : String(error),
    })
    if (isShareCancelled(error)) {
      throw new DOMException('Share cancelled', 'AbortError')
    }
    throw error
  }
}
