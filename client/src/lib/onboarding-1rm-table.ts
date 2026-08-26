import { estimate1RM } from "@/lib/strength-standards"

const PERCENTS = [100, 90, 80, 70] as const

export type OneRmPercentRow = {
  percent: number
  weightKg: number
  reps: number
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/** Reps estimées à un % du 1RM (inverse Epley). */
export function estimatedRepsAtPercent(percent: number): number {
  if (percent >= 100) return 1
  const fraction = percent / 100
  if (fraction <= 0) return 1
  return Math.max(1, Math.round(30 * (1 / fraction - 1)))
}

export function buildOneRmPercentTable(
  weight: number,
  reps: number,
): { oneRM: number; rows: OneRmPercentRow[] } | null {
  const oneRM = estimate1RM(weight, reps)
  if (oneRM <= 0) return null
  return {
    oneRM,
    rows: PERCENTS.map((percent) => ({
      percent,
      weightKg: round1((oneRM * percent) / 100),
      reps: estimatedRepsAtPercent(percent),
    })),
  }
}
