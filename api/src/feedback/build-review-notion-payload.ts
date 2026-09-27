import type { CreateReviewFeedbackDto } from './dto/create-review-feedback.dto.js';
import {
  NOTION_COL_SOURCE,
  NOTION_COL_TYPE,
  NOTION_SOURCE_REVIEW,
  NOTION_TYPE_REVIEW,
} from './notion-feedback-constants.js';
import { notionRichText } from './notion-rich-text.js';
import {
  REVIEW_CHIP_LABELS,
  reviewChipKeysToNotionOptions,
} from './review-chip-labels.js';

const NOTION_TITLE_MAX = 200;

function buildReviewTitle(chips: CreateReviewFeedbackDto['chips']): string {
  const first = chips[0] ? REVIEW_CHIP_LABELS[chips[0]] : 'Review pulse';
  const suffix = chips.length > 1 ? ` (+${chips.length - 1})` : '';
  const title = `Feedback review · ${first}${suffix}`;
  return title.slice(0, NOTION_TITLE_MAX);
}

export type ReviewNotionProfile = {
  firstName: string | null;
  lastName: string | null;
};

/** Payload page Notion pour la base dédiée review (sans Type / Status / tickets). */
export function buildReviewNotionPayload(
  databaseId: string,
  userId: string,
  sessionEmail: string | null,
  profile: ReviewNotionProfile | null,
  payload: CreateReviewFeedbackDto,
  statusName: string,
) {
  const firstName = profile?.firstName?.trim() || 'non renseigné';
  const lastName = profile?.lastName?.trim() || 'non renseigné';
  const email = sessionEmail?.trim() || 'non renseigné';
  const userMessage = payload.message?.trim() ?? '';

  const properties: Record<string, unknown> = {
    Name: {
      title: [{ text: { content: buildReviewTitle(payload.chips) } }],
    },
    [NOTION_COL_SOURCE]: {
      select: { name: NOTION_SOURCE_REVIEW },
    },
    [NOTION_COL_TYPE]: {
      select: { name: NOTION_TYPE_REVIEW },
    },
    Email: notionRichText(email),
    'User ID': notionRichText(userId),
    Prénom: notionRichText(firstName),
    Nom: notionRichText(lastName),
    Status: {
      status: { name: statusName },
    },
    Chips: {
      multi_select: reviewChipKeysToNotionOptions(payload.chips),
    },
    Platform: {
      select: { name: payload.platform },
    },
    Sessions: {
      number: payload.sessionsCount,
    },
    Locale: notionRichText(payload.locale),
    'App version': notionRichText(payload.appVersion),
    Date: {
      date: { start: payload.createdAt.slice(0, 10) },
    },
  };

  if (userMessage) {
    properties.Message = notionRichText(userMessage);
  }
  if (payload.sessionId) {
    properties['Session date'] = notionRichText(payload.sessionId);
  }
  if (payload.deviceModel) {
    properties.Device = notionRichText(payload.deviceModel);
  }
  if (payload.osVersion) {
    properties.OS = notionRichText(payload.osVersion);
  }

  return {
    parent: { database_id: databaseId },
    properties,
  };
}
