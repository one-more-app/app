import { hapticImpact } from "@/lib/haptics"
import { useEffect, useState } from "react"

const DURATION_MS = 1000

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

/** Compte de `0` vers `to` (décimales OK). Respecte prefers-reduced-motion. */
export function useAnimatedNumber(to: number, enabled = true): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!enabled || to <= 0) {
      setValue(to)
      return
    }

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    if (reduced) {
      setValue(to)
      return
    }

    setValue(0)
    let frame = 0
    let lastHapticAt = 0
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS)
      setValue(to * easeOutCubic(t))
      if (now - lastHapticAt >= 140) {
        lastHapticAt = now
        void hapticImpact()
      }
      if (t < 1) {
        frame = requestAnimationFrame(tick)
        return
      }
      setValue(to)
      void hapticImpact()
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [enabled, to])

  return value
}
