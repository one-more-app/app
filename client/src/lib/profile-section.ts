/** Section profil : surface principale (pas de bordure ni d’ombre). */
export const profileSectionClass = "rounded-xl bg-card p-4";

export const profileSectionTitleClass =
  "mb-3 text-sm font-medium text-foreground";

/** Bloc ou ligne imbriqué dans une section — contraste via `secondary`. */
export const profileNestedClass = "rounded-lg bg-secondary";

/** Liste groupée dans une section. */
export const profileNestedListClass =
  "divide-y divide-border/60 overflow-hidden rounded-lg bg-secondary";

/** Lien / bouton cliquable dans une section. */
export const profileNestedInteractiveClass =
  "rounded-lg bg-secondary outline-none transition-colors hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring";
