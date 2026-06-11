import type { CelebrationShareOpen } from '@/components/share/CelebrationShareCard'
import { getCelebrationShareBlob } from '@/lib/celebration-share-prewarm'
import { UI } from '@/lib/translations'
import { Capacitor } from '@capacitor/core'

export type { CelebrationShareOpen }

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
): Promise<'shared'> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const { Share } = await import('@capacitor/share')
  const fileName = `one-more-${Date.now()}.png`
  const base64 = await blobToBase64(blob)

  await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
  })

  const { uri } = await Filesystem.getUri({
    directory: Directory.Cache,
    path: fileName,
  })

  await Share.share({
    title: 'One More',
    text,
    files: [uri],
    dialogTitle: UI.share,
  })

  return 'shared'
}

async function shareBlobWeb(
  blob: Blob,
  text: string,
): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], 'one-more.png', { type: 'image/png' })
  const data: ShareData = {
    title: 'One More',
    text,
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

export async function shareCelebrationPng(
  open: CelebrationShareOpen,
  isDark: boolean,
): Promise<'shared' | 'downloaded'> {
  const blob = await getCelebrationShareBlob(open, isDark)
  const text = shareText(open)

  if (Capacitor.isNativePlatform()) {
    try {
      await shareBlobNative(blob, text)
      return 'shared'
    } catch (error) {
      if (isShareCancelled(error)) {
        throw new DOMException('Share cancelled', 'AbortError')
      }
      return shareBlobWeb(blob, text)
    }
  }

  try {
    return await shareBlobWeb(blob, text)
  } catch (error) {
    if (isShareCancelled(error)) {
      throw new DOMException('Share cancelled', 'AbortError')
    }
    throw error
  }
}
