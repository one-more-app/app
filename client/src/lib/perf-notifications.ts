import { maybeRequestAppReview } from "@/lib/app-review"
import { enqueueCelebration } from "@/lib/celebration-queue"
import type { LeagueChangeDto } from "@/lib/league-types"
import type { LeagueInfo } from "@/lib/strength-standards"
import { getRankIndex } from "@/lib/strength-standards"
import type { PerformanceEntry } from "@/types"

type PB = Pick<PerformanceEntry, "weight" | "reps"> | null

export type LeaguePromotionPayload = {
  exerciseName: string
  prevLeague: LeagueInfo | null
  nextLeague: LeagueInfo
  weight: number
  reps: number
  exerciseImageUrl?: string
}

export type NewRecordCelebrationPayload = {
  exerciseName: string
  weight: number
  reps: number
  leagueAfter: LeagueInfo | null
  exerciseImageUrl?: string
}

export function isNewPersonalBest(prevPB: PB, nextPB: PB): boolean {
  if (!nextPB) return false
  if (!prevPB) return true
  return (
    nextPB.weight > prevPB.weight ||
    (nextPB.weight === prevPB.weight && nextPB.reps > prevPB.reps)
  )
}

export function didLeagueChange(
  prevLeague: LeagueInfo | null,
  nextLeague: LeagueInfo | null,
): boolean {
  if (!nextLeague) return false
  if (!prevLeague) return true
  return prevLeague.rankId !== nextLeague.rankId
}

export function notifyPerfMilestones(params: {
  exerciseName: string
  prevPB: PB
  nextPB: PB
  savedWeight: number
  savedReps: number
  league?: LeagueChangeDto | null
  exerciseImageUrl?: string
}): void {
  const {
    exerciseName,
    prevPB,
    nextPB,
    savedWeight,
    savedReps,
    league,
    exerciseImageUrl,
  } = params

  const prevLeague = league?.before ?? null
  const nextLeague = league?.after ?? null
  const isRecord = isNewPersonalBest(prevPB, nextPB)
  const leagueChanged =
    league?.promoted ??
    (nextLeague &&
      prevLeague &&
      getRankIndex(nextLeague.rankId) > getRankIndex(prevLeague.rankId))

  if (!isRecord && !leagueChanged) return

  if (leagueChanged && nextLeague) {
    enqueueCelebration({
      kind: "league",
      payload: {
        exerciseName,
        prevLeague,
        nextLeague,
        weight: savedWeight,
        reps: savedReps,
        exerciseImageUrl,
      },
    })
    return
  }

  if (isRecord) {
    enqueueCelebration({
      kind: "record",
      payload: {
        exerciseName,
        weight: savedWeight,
        reps: savedReps,
        leagueAfter: nextLeague,
        exerciseImageUrl,
      },
    })
    void maybeRequestAppReview("milestone")
  }
}
