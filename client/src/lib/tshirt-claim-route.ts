import type { TshirtRewardType } from "@/lib/rewards-api";

const TSHIRT_REWARD_TYPES: TshirtRewardType[] = [
  "referral_limited",
  "annual_classic_pack",
];

export function isTshirtRewardType(value: string | undefined): value is TshirtRewardType {
  return TSHIRT_REWARD_TYPES.includes(value as TshirtRewardType);
}

export function tshirtClaimPath(rewardType: TshirtRewardType): string {
  return `/rewards/tshirt/${rewardType}`;
}

export function parseTshirtClaimRewardType(
  pathname: string,
): TshirtRewardType | null {
  const prefix = "/rewards/tshirt/";
  if (!pathname.startsWith(prefix)) return null;
  const rewardType = pathname.slice(prefix.length).split("/")[0];
  return isTshirtRewardType(rewardType) ? rewardType : null;
}
