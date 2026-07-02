import { apiFetch } from "@/lib/api";

export type TshirtRewardStatus = "pending" | "shipped" | "delivered";

export type TshirtRewardClaim = {
  id: string;
  status: TshirtRewardStatus;
  size: string;
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  trackingNumber: string | null;
  claimedAt: string;
  shippedAt: string | null;
};

export type TshirtRewardStatusResponse = {
  eligible: boolean;
  claim: TshirtRewardClaim | null;
};

export const TSHIRT_REWARD_SWR_KEY = "tshirt-reward";

export const TSHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export type TshirtSize = (typeof TSHIRT_SIZES)[number];

export type ClaimTshirtPayload = {
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
