export const EVENT_GENDER_ROTATION_MS = 15_000;

export const EVENT_LEADERBOARD_POLL_MS = 2_000;

/** Polling TV pendant une tentative live (ms). */
export const EVENT_LIVE_ATTEMPT_POLL_MS = 500;

/** Durée pour défiler d'une ligne dans le ticker (ms). */
export const EVENT_LEADERBOARD_ROW_ROTATION_MS = 1_200;

export const EVENT_EXERCISES = [
  "pull_up",
  "dips",
  "push_up",
] as const;

export type EventExerciseSlug = (typeof EVENT_EXERCISES)[number];

export type EventGenderSlug = "male" | "female";

export const EVENT_EXERCISE_META: Record<
  EventExerciseSlug,
  { labelKey: "eventStandExercisePullUp" | "eventStandExerciseDips" | "eventStandExercisePushUp" }
> = {
  pull_up: {
    labelKey: "eventStandExercisePullUp",
  },
  dips: {
    labelKey: "eventStandExerciseDips",
  },
  push_up: {
    labelKey: "eventStandExercisePushUp",
  },
};
