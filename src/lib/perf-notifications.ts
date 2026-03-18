import { toast } from "sonner"

import type { LeagueInfo } from "@/lib/strength-standards"
import { getLeagueInfo } from "@/lib/strength-standards"
import { maybeRequestAppReview } from "@/lib/app-review"
import { hapticNotificationSuccess } from "@/lib/haptics"
import {
  LEAGUE_TOAST_DESCRIPTION_CLASS,
  toastClassForLeague,
} from "@/lib/league-colors"
import { playMilestoneSound } from "@/lib/milestone-sound"
import type { PerformanceEntry, TrackedExercise, UserProfile } from "@/types"

type PB = Pick<PerformanceEntry, "weight" | "reps"> | null

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
  return prevLeague.level !== nextLeague.level
}

export function computeLeagueFromPB(params: {
  exercise: TrackedExercise
  personalBest: PB
  profile: UserProfile
}): LeagueInfo | null {
  const { exercise, personalBest, profile } = params
  if (exercise.isCustom || !personalBest) return null

  return (
    getLeagueInfo({
      weight: personalBest.weight,
      reps: personalBest.reps,
      bodyWeightKg: profile.weightKg,
      gender: profile.gender,
      exerciseName: exercise.originalName ?? exercise.name,
      exerciseMetadata:
        exercise.equipment && exercise.target
          ? {
              equipment: exercise.equipment,
              target: exercise.target,
              bodyPart: exercise.bodyPart,
            }
          : undefined,
    }) ?? null
  )
}

export function notifyPerfMilestones(params: {
  exerciseName: string
  prevPB: PB
  nextPB: PB
  prevLeague: LeagueInfo | null
  nextLeague: LeagueInfo | null
}): void {
  const { exerciseName, prevPB, nextPB, prevLeague, nextLeague } = params

  const newRecord = isNewPersonalBest(prevPB, nextPB)
  const leagueUp = didLeagueChange(prevLeague, nextLeague)
  if (!newRecord && !leagueUp) return

  void maybeRequestAppReview("milestone")

  playMilestoneSound()
  void hapticNotificationSuccess()

  const leagueToastClass = nextLeague
    ? toastClassForLeague(nextLeague.level)
    : undefined

  if (newRecord && leagueUp) {
    toast.success("Nouveau record et nouveau palier", {
      className: leagueToastClass,
      classNames: { description: LEAGUE_TOAST_DESCRIPTION_CLASS },
      description: `${exerciseName} · ${nextPB!.weight} kg × ${nextPB!.reps} reps · ${nextLeague!.label}`,
    })
    return
  }

  // Nouveau record seul (passage de ligue = toujours un record, donc pas de cas "palier seul")
  toast.success("Nouveau record", {
    description: `${exerciseName} · ${nextPB!.weight} kg × ${nextPB!.reps} reps`,
  })
}

