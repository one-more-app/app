import { onboardingEntrance } from "@/components/onboarding/onboarding-motion";

/** Entrée écran / header : élan depuis la gauche (comme onboarding). */
export const eventScreenEntrance = (...classes: (string | false | undefined)[]) =>
  onboardingEntrance(
    classes,
    "animate-in fade-in-0 slide-in-from-left-4 duration-400",
  );

/** Carte classement : glisse de gauche à droite, stagger par colonne. */
export const eventCardEntrance = (...classes: (string | false | undefined)[]) =>
  onboardingEntrance(
    classes,
    "animate-in fade-in-0 slide-in-from-left-4 duration-400",
  );

/** Segment rang (premier élément de la ligne). */
export const eventRecordRankEntrance = (...classes: (string | false | undefined)[]) =>
  onboardingEntrance(
    classes,
    "inline-flex animate-in fade-in-0 slide-in-from-left-4 duration-400",
  );

/** Segment nom / reps (suite du mouvement gauche → droite). */
export const eventRecordFieldEntrance = (...classes: (string | false | undefined)[]) =>
  onboardingEntrance(
    classes,
    "inline-block min-w-0 animate-in fade-in-0 slide-in-from-left-3 duration-350",
  );

/** GIF / chip exercice. */
export const eventChipEntrance = (...classes: (string | false | undefined)[]) =>
  onboardingEntrance(
    classes,
    "animate-in fade-in-0 slide-in-from-left-3 duration-350",
  );

/** Délai entre rang, prénom et reps sur une même ligne (comme AnimatedWords). */
export const EVENT_RECORD_SEGMENT_STAGGER_MS = 55;

/** Délai entre chaque ligne de classement. */
export const EVENT_ROW_STAGGER_MS = 120;

/** Délai entre chaque colonne exercice. */
export const EVENT_COLUMN_STAGGER_MS = 120;

/** Durée slide segment avant pop record (#1). */
export const EVENT_RECORD_POP_DELAY_MS = 400;

/** Entrée overlay célébration (élan vers le haut, court). */
export const eventCelebrationEntrance = (...classes: (string | false | undefined)[]) =>
  onboardingEntrance(
    classes,
    "animate-in fade-in-0 slide-in-from-bottom-3 duration-350",
  );

/** Délai entre blocs de l’overlay record / t-shirt. */
export const EVENT_CELEBRATION_STAGGER_MS = 80;
