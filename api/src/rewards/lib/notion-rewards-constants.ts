import { TshirtRewardType } from '../entities/tshirt-reward-type.enum.js';

export const NOTION_REWARD_TYPE_REFERRAL = 'Parrainage';
export const NOTION_REWARD_TYPE_ANNUAL = 'Pack annuel';

export const NOTION_REWARD_STATUS_DEFAULT = 'À traiter';
export const NOTION_REWARD_STATUS_OPTIONS = [
  NOTION_REWARD_STATUS_DEFAULT,
  'Expédié',
  'Livré',
] as const;

export const NOTION_REWARD_SIZE_OPTIONS = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
] as const;

export function rewardTypeToNotionLabel(rewardType: TshirtRewardType): string {
  if (rewardType === TshirtRewardType.AnnualClassicPack) {
    return NOTION_REWARD_TYPE_ANNUAL;
  }
  return NOTION_REWARD_TYPE_REFERRAL;
}

export const NOTION_REWARD_TYPE_OPTIONS = [
  NOTION_REWARD_TYPE_REFERRAL,
  NOTION_REWARD_TYPE_ANNUAL,
] as const;
