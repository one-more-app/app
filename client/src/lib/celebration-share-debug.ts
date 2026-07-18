/** Timings console pour diagnostiquer le 1er Partager (Safari / Xcode). */

export type ShareTrace = {
  log: (label: string, data?: Record<string, unknown>) => void
  elapsedMs: () => number
}

export function createShareTrace(origin: string, meta?: Record<string, unknown>): ShareTrace {
  const t0 = Date.now()
  let step = 0

  const log = (label: string, data?: Record<string, unknown>) => {
    step += 1
    console.log('[share-debug]', {
      origin,
      step,
      label,
      elapsedMs: Date.now() - t0,
      t: Date.now(),
      ...meta,
      ...data,
    })
  }

  log('trace-start')

  return {
    log,
    elapsedMs: () => Date.now() - t0,
  }
}
