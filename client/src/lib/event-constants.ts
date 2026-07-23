export const EVENT_GENDER_ROTATION_MS = 15_000;

/** Fallback HTTP si le WebSocket event est déconnecté (ms). */
export const EVENT_LEADERBOARD_POLL_MS = 2_000;

/** Polling de secours même avec WS connecté (ms). */
export const EVENT_LEADERBOARD_WS_FALLBACK_POLL_MS = 15_000;

/** Polling TV pendant une tentative live si WS down (ms). */
export const EVENT_LIVE_ATTEMPT_POLL_MS = 500;

/** Durée pour défiler d'une ligne dans le ticker (ms). */
export const EVENT_LEADERBOARD_ROW_ROTATION_MS = 1_200;

/** Relance l'animation du titre TV pour attirer l'œil (ms). */
export const EVENT_TITLE_REPLAY_MS = 7_000;

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

/** Icônes locales (silhouette) à la place des GIFs catalogue. */
export const EVENT_EXERCISE_ICONS: Record<EventExerciseSlug, string> = {
  pull_up: "/images/event/icon-pull-up.png",
  dips: "/images/event/icon-dips.png",
  push_up: "/images/event/icon-push-up.png",
};
