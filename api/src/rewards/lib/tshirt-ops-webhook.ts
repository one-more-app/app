import type { TshirtRewardClaimEntity } from '../entities/tshirt-reward-claim.entity.js';
import { TshirtRewardType } from '../entities/tshirt-reward-type.enum.js';

export function isDiscordWebhookUrl(webhookUrl: string): boolean {
  try {
    const host = new URL(webhookUrl).hostname.toLowerCase();
    return host === 'discord.com' || host === 'discordapp.com';
  } catch {
    return false;
  }
}

type DiscordEmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

type DiscordWebhookPayload = {
  content: string;
  embeds: Array<{
    title: string;
    color: number;
    fields: DiscordEmbedField[];
    timestamp: string;
    footer: { text: string };
  }>;
};

type GenericOpsWebhookPayload = {
  type: 'tshirt_reward_claim';
  claimId: string;
  userId: string;
  status: string;
  size: string;
  gender: string;
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  claimedAt: string;
};

export function buildTshirtOpsWebhookPayload(
  claim: TshirtRewardClaimEntity,
  webhookUrl: string,
): DiscordWebhookPayload | GenericOpsWebhookPayload {
  const generic: GenericOpsWebhookPayload = {
    type: 'tshirt_reward_claim',
    claimId: claim.id,
    userId: claim.userId,
    status: claim.status,
    size: claim.size ?? '',
    gender: claim.gender ?? '',
    fullName: claim.fullName ?? '',
    street: claim.street ?? '',
    city: claim.city ?? '',
    postalCode: claim.postalCode ?? '',
    country: claim.country ?? '',
    claimedAt: claim.claimedAt?.toISOString() ?? new Date().toISOString(),
  };

  if (!isDiscordWebhookUrl(webhookUrl)) {
    return generic;
  }

  const address = `${claim.street ?? ''}\n${claim.postalCode ?? ''} ${claim.city ?? ''}\n${claim.country ?? ''}`;
  const rewardTitle =
    claim.rewardType === TshirtRewardType.AnnualClassicPack
      ? 'Pack annuel noir + blanc'
      : 'T-shirt edition limitee parrainage';

  return {
    content: '🎽 **Nouveau claim t-shirt One More**',
    embeds: [
      {
        title: rewardTitle,
        color: 0x58cc02,
        fields: [
          { name: 'Nom', value: claim.fullName ?? '', inline: true },
          { name: 'Taille', value: claim.size ?? '', inline: true },
          { name: 'Genre', value: claim.gender ?? '', inline: true },
          { name: 'Statut', value: claim.status, inline: true },
          { name: 'Adresse', value: address },
          { name: 'User ID', value: claim.userId },
          { name: 'Claim ID', value: claim.id },
        ],
        timestamp: claim.claimedAt?.toISOString() ?? new Date().toISOString(),
        footer: { text: 'One More — fulfilment t-shirt' },
      },
    ],
  };
}
