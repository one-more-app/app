import type { FeedbackKind } from './dto/create-feedback.dto.js';

/** Colonne Notion : Select */
export const NOTION_COL_SOURCE = 'Source';
/** Colonne Notion : Select (Bug, Idea, Suggestion, Review) */
export const NOTION_COL_TYPE = 'Type';

export const NOTION_SOURCE_REVIEW = 'Review pulse';
export const NOTION_SOURCE_SETTINGS = 'Réglages';

export const NOTION_TYPE_REVIEW = 'Review';

export const NOTION_TYPE_BY_KIND: Record<FeedbackKind, string> = {
  bug: 'Bug',
  idea: 'Idea',
  suggestion: 'Suggestion',
};

export const NOTION_SOURCE_OPTIONS = [
  NOTION_SOURCE_REVIEW,
  NOTION_SOURCE_SETTINGS,
] as const;

export const NOTION_TYPE_OPTIONS = [
  'Bug',
  'Idea',
  'Suggestion',
  NOTION_TYPE_REVIEW,
] as const;
