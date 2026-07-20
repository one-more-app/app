import type { EventExerciseSlug, EventGenderSlug } from "@/lib/event-constants";
import {
  getLeagueInfo,
  type ExerciseMetadata,
  type LeagueInfo,
} from "@/lib/strength-standards";

/** Profil physique par défaut pour estimer le palier sur le stand (sans saisie poids/taille). */
export const EVENT_DEFAULT_PROFILE_BY_GENDER: Record<
  EventGenderSlug,
  { weightKg: number; heightCm: number }
> = {
  male: { weightKg: 75, heightCm: 175 },
  female: { weightKg: 62, heightCm: 165 },
};

const EVENT_CATALOG_EXERCISE_NAMES: Record<EventExerciseSlug, string> = {
  pull_up: "pull-up",
  dips: "chest dip",
  push_up: "push-up",
};

const EVENT_EXERCISE_LEAGUE_META: Record<EventExerciseSlug, ExerciseMetadata> = {
  pull_up: { equipment: "body weight", target: "lats" },
  dips: { equipment: "body weight", target: "pectorals" },
  push_up: { equipment: "body weight", target: "pectorals" },
};

export function getEventLeagueForPerf(
  exercise: EventExerciseSlug,
  gender: EventGenderSlug,
  reps: number,
): LeagueInfo | null {
  if (reps <= 0) return null;

  const profile = EVENT_DEFAULT_PROFILE_BY_GENDER[gender];

  return getLeagueInfo({
    weight: 0,
    reps,
    bodyWeightKg: profile.weightKg,
    gender,
    exerciseName: EVENT_CATALOG_EXERCISE_NAMES[exercise],
    exerciseMetadata: EVENT_EXERCISE_LEAGUE_META[exercise],
  });
}
