import { TshirtRewardStatus } from '../entities/tshirt-reward-status.enum.js';
import {
  NOTION_REWARD_STATUS_DEFAULT,
  NOTION_REWARD_STATUS_OPTIONS,
} from './notion-rewards-constants.js';

const NOTION_TO_CLAIM: Record<string, TshirtRewardStatus> = {
  [NOTION_REWARD_STATUS_DEFAULT]: TshirtRewardStatus.Pending,
  Expédié: TshirtRewardStatus.Shipped,
  Livré: TshirtRewardStatus.Delivered,
};

export function notionRewardStatusToClaimStatus(
  notionStatusName: string | null | undefined,
): TshirtRewardStatus | null {
  const name = notionStatusName?.trim();
  if (!name) return null;
  if (
    !(NOTION_REWARD_STATUS_OPTIONS as readonly string[]).includes(name) &&
    name !== NOTION_REWARD_STATUS_DEFAULT
  ) {
    return null;
  }
  return NOTION_TO_CLAIM[name] ?? null;
}

export function claimStatusRank(status: TshirtRewardStatus): number {
  switch (status) {
    case TshirtRewardStatus.ClaimPending:
      return 0;
    case TshirtRewardStatus.Pending:
      return 1;
    case TshirtRewardStatus.Shipped:
      return 2;
    case TshirtRewardStatus.Delivered:
      return 3;
    default:
      return 0;
  }
}

export function isForwardStatusTransition(
  from: TshirtRewardStatus,
  to: TshirtRewardStatus,
): boolean {
  return claimStatusRank(to) > claimStatusRank(from);
}
