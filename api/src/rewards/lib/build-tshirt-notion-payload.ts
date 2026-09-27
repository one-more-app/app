import type { TshirtRewardClaimEntity } from '../entities/tshirt-reward-claim.entity.js';
import {
  NOTION_REWARD_STATUS_DEFAULT,
  rewardTypeToNotionLabel,
} from './notion-rewards-constants.js';
import { notionRichText } from './notion-rich-text.js';

const NOTION_TITLE_MAX = 200;

function buildClaimTitle(fullName: string | null): string {
  const name = fullName?.trim() || 'Réclamation t-shirt';
  return name.slice(0, NOTION_TITLE_MAX);
}

export function buildTshirtNotionPayload(
  databaseId: string,
  claim: TshirtRewardClaimEntity,
  sessionEmail: string | null,
  statusName: string = NOTION_REWARD_STATUS_DEFAULT,
) {
  const claimedAt = claim.claimedAt ?? new Date();
  const email = sessionEmail?.trim() ?? '';

  const properties: Record<string, unknown> = {
    Nom: {
      title: [{ text: { content: buildClaimTitle(claim.fullName) } }],
    },
    Type: {
      select: { name: rewardTypeToNotionLabel(claim.rewardType) },
    },
    Statut: {
      status: { name: statusName },
    },
    Taille: {
      select: { name: claim.size ?? 'M' },
    },
    'User ID': notionRichText(claim.userId),
    'Claim ID': notionRichText(claim.id),
    Rue: notionRichText(claim.street?.trim() ?? ''),
    Ville: notionRichText(claim.city?.trim() ?? ''),
    'Code postal': notionRichText(claim.postalCode?.trim() ?? ''),
    Pays: notionRichText(claim.country?.trim() ?? ''),
    'Réclamé le': {
      date: { start: claimedAt.toISOString().slice(0, 10) },
    },
  };

  if (email) {
    properties.Email = { email };
  }

  return {
    parent: { database_id: databaseId },
    properties,
  };
}
