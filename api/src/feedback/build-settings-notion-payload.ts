import type { CreateFeedbackDto } from './dto/create-feedback.dto.js';
import {
  NOTION_COL_SOURCE,
  NOTION_COL_TYPE,
  NOTION_SOURCE_SETTINGS,
  NOTION_TYPE_BY_KIND,
} from './notion-feedback-constants.js';
import { notionRichText } from './notion-rich-text.js';

export type SettingsNotionProfile = {
  firstName: string | null;
  lastName: string | null;
};

export function buildSettingsNotionPayload(
  databaseId: string,
  userId: string,
  sessionEmail: string | null,
  profile: SettingsNotionProfile | null,
  payload: CreateFeedbackDto,
  statusName: string,
) {
  const firstName = profile?.firstName?.trim() || 'non renseigné';
  const lastName = profile?.lastName?.trim() || 'non renseigné';
  const email = sessionEmail?.trim() || 'non renseigné';
  const platform = payload.context?.platform ?? 'web';
  const appVersion = payload.context?.appVersion?.trim() ?? '';

  const properties: Record<string, unknown> = {
    Name: {
      title: [{ text: { content: payload.title.slice(0, 200) } }],
    },
    [NOTION_COL_SOURCE]: {
      select: { name: NOTION_SOURCE_SETTINGS },
    },
    [NOTION_COL_TYPE]: {
      select: { name: NOTION_TYPE_BY_KIND[payload.kind] },
    },
    Status: {
      status: { name: statusName },
    },
    Email: notionRichText(email),
    'User ID': notionRichText(userId),
    Prénom: notionRichText(firstName),
    Nom: notionRichText(lastName),
    Message: notionRichText(payload.message),
    Platform: {
      select: { name: platform },
    },
  };

  if (appVersion) {
    properties['App version'] = notionRichText(appVersion);
  }

  return {
    parent: { database_id: databaseId },
    properties,
  };
}
