import { EventExercise } from './entities/event-exercise.enum.js';

/** Noms catalogue ExerciseDB alignés sur le stand événement. */
export const EVENT_CATALOG_EXERCISE_NAMES: Record<EventExercise, string> = {
  [EventExercise.PullUp]: 'pull-up',
  [EventExercise.Dips]: 'chest dip',
  [EventExercise.PushUp]: 'push-up',
};

export type EventExerciseMedia = {
  gifUrl: string | null;
  name: string;
  nameFr: string | null;
};

export type EventExerciseMediaMap = Record<EventExercise, EventExerciseMedia>;
