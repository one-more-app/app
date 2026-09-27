import {
  NOTION_COL_SOURCE,
  NOTION_COL_TYPE,
  NOTION_SOURCE_SETTINGS,
  NOTION_TYPE_ACCOUNT_DELETION,
} from './notion-feedback-constants.js';
import { notionRichText } from './notion-rich-text.js';

export type AccountDeletionNotionProfile = {
  firstName: string | null;
  lastName: string | null;
};

export function buildAccountDeletionNotionPayload(
  databaseId: string,
  userId: string,
  sessionEmail: string | null,
  profile: AccountDeletionNotionProfile | null,
  comment: string,
  statusName: string,
) {
  const firstName = profile?.firstName?.trim() || 'non renseigné';
  const lastName = profile?.lastName?.trim() || 'non renseigné';
  const email = sessionEmail?.trim() || 'non renseigné';

  return {
    parent: { database_id: databaseId },
    properties: {
      Name: {
        title: [{ text: { content: 'Suppression de compte' } }],
      },
      [NOTION_COL_SOURCE]: {
        select: { name: NOTION_SOURCE_SETTINGS },
      },
      [NOTION_COL_TYPE]: {
        select: { name: NOTION_TYPE_ACCOUNT_DELETION },
      },
      Status: {
        status: { name: statusName },
      },
      Email: notionRichText(email),
      'User ID': notionRichText(userId),
      Prénom: notionRichText(firstName),
      Nom: notionRichText(lastName),
      Message: notionRichText(comment),
    },
  };
}
