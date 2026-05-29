import { toast } from "sonner"

import { maybeRequestAppReview } from "@/lib/app-review"
import { hapticNotificationSuccess } from "@/lib/haptics"
import {
  LEAGUE_TOAST_DESCRIPTION_CLASS,
  toastClassForLeague,
} from "@/lib/league-colors"
import { playMilestoneSound } from "@/lib/milestone-sound"
import type { LeagueInfo } from "@/lib/strength-standards"
import { getLeagueInfo } from "@/lib/strength-standards"
import type { PerformanceEntry, TrackedExercise, UserProfile } from "@/types"

type PB = Pick<PerformanceEntry, "weight" | "reps"> | null

/** Données affichées par l’overlay de célébration (passage de palier). */
export type LeaguePromotionPayload = {
  exerciseName: string
  prevLeague: LeagueInfo | null
  nextLeague: LeagueInfo
  weight: number
  reps: number
  /** URL absolue de l’illo (GIF) pour partage ; optionnel */
  exerciseImageUrl?: string
}

/** Données affichées par l’overlay « nouveau record » (sans changement de palier). */
export type NewRecordCelebrationPayload = {
  exerciseName: string
  weight: number
  reps: number
  /** Ligue au record (dégradé) ; null si exo perso / non classé */
  leagueAfter: LeagueInfo | null
  exerciseImageUrl?: string
}

let leaguePromotionHandler: ((p: LeaguePromotionPayload) => void) | null =
  null

let newRecordCelebrationHandler:
  | ((p: NewRecordCelebrationPayload) => void)
  | null = null

/** Enregistré par `LeaguePromotionCelebrationHost` ; remplace le toast combo record+palier. */
export function setLeaguePromotionHandler(
  handler: ((p: LeaguePromotionPayload) => void) | null,
): void {
  leaguePromotionHandler = handler
}

/** Enregistré par le même hôte ; remplace le toast « Nouveau record » seul. */
export function setNewRecordCelebrationHandler(
  handler: ((p: NewRecordCelebrationPayload) => void) | null,
): void {
  newRecordCelebrationHandler = handler
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
  /** Poids et reps de la perf venant d’être enregistrée (affichage). */
  savedWeight: number
  savedReps: number
  prevLeague: LeagueInfo | null
  nextLeague: LeagueInfo | null
  exerciseImageUrl?: string
}): void {
  const {
    exerciseName,
    prevPB,
    nextPB,
    savedWeight,
    savedReps,
    prevLeague,
    nextLeague,
    exerciseImageUrl,
  } = params

  const newRecord = isNewPersonalBest(prevPB, nextPB)
  const leagueUp = didLeagueChange(prevLeague, nextLeague)
  if (!newRecord && !leagueUp) {
    toast.success("Performance enregistrée", {
      description: `${exerciseName} · ${savedWeight} kg × ${savedReps} reps`,
    })
    return
  }

  void maybeRequestAppReview("milestone")

  playMilestoneSound()
  void hapticNotificationSuccess()

  const leagueToastClass = nextLeague
    ? toastClassForLeague(nextLeague.level)
    : undefined

  if (newRecord && leagueUp && nextLeague && nextPB && leaguePromotionHandler) {
    leaguePromotionHandler({
      exerciseName,
      prevLeague,
      nextLeague,
      weight: savedWeight,
      reps: savedReps,
      exerciseImageUrl,
    })
    return
  }

  if (newRecord && leagueUp) {
    toast.success("Nouveau record et nouveau palier", {
      className: leagueToastClass,
      classNames: { description: LEAGUE_TOAST_DESCRIPTION_CLASS },
      description: `${exerciseName} · ${savedWeight} kg × ${savedReps} reps · ${nextLeague!.label}`,
    })
    return
  }

  if (newRecord && nextPB && newRecordCelebrationHandler) {
    newRecordCelebrationHandler({
      exerciseName,
      weight: savedWeight,
      reps: savedReps,
      leagueAfter: nextLeague,
      exerciseImageUrl,
    })
    return
  }

  if (newRecord) {
    toast.success("Nouveau record", {
      description: `${exerciseName} · ${savedWeight} kg × ${savedReps} reps`,
    })
  }
}
