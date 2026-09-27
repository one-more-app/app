import type { ReviewChipKey } from './dto/create-review-feedback.dto.js';

/** Libellés FR des chips (alignés sur le client). Options multi_select Notion. */
export const REVIEW_CHIP_LABELS: Record<ReviewChipKey, string> = {
  slow_logging: 'Saisie trop lente',
  missing_exercise: 'Il manque un exercice',
  analytics: 'Stats et progression',
  cardio: 'Cardio (Strava · Garmin · Apple Santé)',
  data: 'Import / export de données',
  bug: 'Un bug',
  other: 'Autre',
};

/** Notion refuse les virgules dans les noms d’options multi_select. */
export function notionSafeMultiSelectOptionName(name: string): string {
  return name.replace(/,/g, ' · ').trim();
}

export function reviewChipKeysToNotionOptions(
  chips: ReviewChipKey[],
): { name: string }[] {
  return chips.map((key) => ({
    name: notionSafeMultiSelectOptionName(REVIEW_CHIP_LABELS[key]),
  }));
}

export function reviewChipNotionOptionNames(): string[] {
  return Object.values(REVIEW_CHIP_LABELS).map(notionSafeMultiSelectOptionName);
}
