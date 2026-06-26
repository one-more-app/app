import { Button } from "@/components/ui/button";
import { TshirtRewardVisual } from "@/components/profile/TshirtRewardVisual";
import type { TshirtRewardClaim } from "@/lib/rewards-api";
import { UI } from "@/lib/translations";
import {
  EXERCISE_BONUS_PER_REFERRAL,
  REFERRALS_FOR_TSHIRT_REWARD,
} from "@one-more/shared/access-config";
import { Check, Gift, Users } from "lucide-react";
import type { ReactNode } from "react";

type ReferralBattlePassProps = {
  referralCount: number;
  tshirtRewardEligible: boolean;
  referralsUntilTshirt: number;
  claim: TshirtRewardClaim | null;
  onClaimTshirt: () => void;
};

type NodeStatus = "done" | "current" | "locked";

function nodeStatusForReferral(step: number, referralCount: number): NodeStatus {
  if (referralCount >= step) return "done";
  if (referralCount === step - 1) return "current";
  return "locked";
}

export function ReferralBattlePass({
  referralCount,
  tshirtRewardEligible,
  referralsUntilTshirt,
  claim,
  onClaimTshirt,
}: ReferralBattlePassProps) {
  const filledSegments = Math.min(referralCount, REFERRALS_FOR_TSHIRT_REWARD);
  const progressPct =
    REFERRALS_FOR_TSHIRT_REWARD > 0
      ? (filledSegments / REFERRALS_FOR_TSHIRT_REWARD) * 100
      : 0;

  const rewardStatus: NodeStatus = claim
    ? "done"
    : tshirtRewardEligible
      ? "current"
      : "locked";

  const statusMessage = claim
    ? claim.status === "shipped"
      ? claim.trackingNumber
        ? UI.tshirtClaimShippedWithTracking.replace(
            "{tracking}",
            claim.trackingNumber,
          )
        : UI.tshirtClaimShipped
      : claim.status === "delivered"
        ? UI.tshirtClaimDelivered
        : UI.tshirtClaimPending
    : tshirtRewardEligible
      ? UI.referralTshirtEarned
      : UI.referralBattlePassRemaining.replace(
          "{count}",
          String(referralsUntilTshirt),
        );

  return (
    <div className="space-y-4 rounded-xl border border-border/60 p-4">
      <p className="text-sm font-semibold text-foreground">
        {UI.referralBattlePassTitle}
      </p>

      <TshirtRewardVisual highlight={tshirtRewardEligible && !claim} />

      <div className="space-y-3 pt-1">
        <div className="relative px-1">
          <div className="absolute left-4 right-4 top-4 h-1 rounded-full bg-muted" />
          <div
            className="absolute left-4 top-4 h-1 rounded-full bg-accent transition-all duration-500"
            style={{ width: `calc((100% - 2rem) * ${progressPct / 100})` }}
          />
          <div className="relative flex items-start justify-between">
            {Array.from({ length: REFERRALS_FOR_TSHIRT_REWARD }, (_, i) => {
              const step = i + 1;
              const status = nodeStatusForReferral(step, referralCount);
              return (
                <BattlePassNode
                  key={step}
                  label={String(step)}
                  sublabel={`+${EXERCISE_BONUS_PER_REFERRAL}`}
                  status={status}
                  icon={<Users className="size-3" />}
                />
              );
            })}
            <BattlePassNode
              label=""
              sublabel={UI.referralBattlePassReward}
              status={rewardStatus}
              icon={<Gift className="size-3.5" />}
              isReward
            />
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {UI.referralBattlePassLegend.replace(
            "{bonus}",
            String(EXERCISE_BONUS_PER_REFERRAL),
          )}
        </p>
      </div>

      <p className="text-center text-sm text-foreground">{statusMessage}</p>

      {tshirtRewardEligible && !claim ? (
        <Button className="w-full" onClick={onClaimTshirt}>
          <Gift className="mr-2 size-4" />
          {UI.tshirtClaimButton}
        </Button>
      ) : null}
    </div>
  );
}

function BattlePassNode({
  label,
  sublabel,
  status,
  icon,
  isReward = false,
}: {
  label: string;
  sublabel: string;
  status: NodeStatus;
  icon: ReactNode;
  isReward?: boolean;
}) {
  return (
    <div className="flex w-10 flex-col items-center gap-1 sm:w-11">
      <div
        className={
          status === "done"
            ? "flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm"
            : status === "current"
              ? "flex size-8 items-center justify-center rounded-full border-2 border-accent bg-background text-accent shadow-[0_0_0_3px] shadow-accent/25"
              : "flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground"
        }
      >
        {status === "done" ? (
          <Check className="size-4" strokeWidth={2.5} />
        ) : (
          icon
        )}
      </div>
      {label ? (
        <span className="text-[10px] font-semibold tabular-nums text-foreground">
          {label}
        </span>
      ) : null}
      <span
        className={
          isReward && status === "current"
            ? "text-center text-[9px] font-semibold leading-tight text-accent"
            : "text-center text-[9px] leading-tight text-muted-foreground"
        }
      >
        {sublabel}
      </span>
    </div>
  );
}
