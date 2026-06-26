import { TshirtRewardVisual } from "@/components/profile/TshirtRewardVisual";
import { BattlePassNode } from "@/components/referral/BattlePassNode";
import { TshirtDeliveryStepper } from "@/components/referral/TshirtDeliveryStepper";
import { Button } from "@/components/ui/button";
import type { TshirtRewardClaim } from "@/lib/rewards-api";
import { UI } from "@/lib/translations";
import {
    EXERCISE_BONUS_PER_REFERRAL,
    REFERRALS_FOR_TSHIRT_REWARD,
} from "@one-more/shared/access-config";
import { Gift, Users } from "lucide-react";

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
        ? null
        : tshirtRewardEligible
            ? UI.referralTshirtEarned
            : UI.referralBattlePassRemaining.replace(
                "{count}",
                String(referralsUntilTshirt),
            );

    return (
        <div className="space-y-4 rounded-xl bg-card p-4">
            <p className="text-xs font-one-more uppercase italic text-foreground">
                {UI.referralBattlePassTitle}
            </p>

            <TshirtRewardVisual highlight={tshirtRewardEligible && !claim} />

            <div className="space-y-3 pt-1">
                <div className="relative px-1">
                    <div className="absolute left-4 right-4 top-4 h-1 rounded-full bg-secondary" />
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
                            highlightSublabel
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

            {claim ? (
                <TshirtDeliveryStepper claim={claim} />
            ) : statusMessage ? (
                <p className="text-center text-sm text-foreground">
                    {statusMessage}
                </p>
            ) : null}

            {tshirtRewardEligible && !claim ? (
                <Button className="w-full" onClick={onClaimTshirt}>
                    <Gift className="mr-2 size-4" />
                    {UI.tshirtClaimButton}
                </Button>
            ) : null}
        </div>
    );
}
