import { apiFetch } from "@/lib/api";

export type TshirtRewardType = "referral_limited" | "annual_classic_pack";
export type TshirtRewardStatus = "pending" | "shipped" | "delivered";
export type TshirtRewardClaimStatus = "claim_pending" | TshirtRewardStatus;

export type TshirtRewardClaim = {
  id: string;
  rewardType: TshirtRewardType;
  status: TshirtRewardClaimStatus;
  size: string | null;
  fullName: string | null;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  trackingNumber: string | null;
  claimedAt: string | null;
  shippedAt: string | null;
};

export type TshirtRewardStatusResponse = {
  pendingRewards: TshirtRewardType[];
  claims: TshirtRewardClaim[];
};

export const TSHIRT_REWARD_SWR_KEY = "tshirt-reward";

export const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export type TshirtSize = (typeof TSHIRT_SIZES)[number];

export type ClaimTshirtPayload = {
  rewardType: TshirtRewardType;
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  size: TshirtSize;
};

export async function fetchTshirtRewardStatus(): Promise<TshirtRewardStatusResponse> {
  return await apiFetch<TshirtRewardStatusResponse>("/me/rewards/tshirt");
}

export async function claimTshirtReward(
  payload: ClaimTshirtPayload,
): Promise<TshirtRewardClaim> {
  return await apiFetch<TshirtRewardClaim>("/me/rewards/tshirt/claim", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
