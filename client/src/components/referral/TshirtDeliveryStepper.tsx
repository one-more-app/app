import {
    BattlePassNode,
    type BattlePassNodeStatus,
} from "@/components/referral/BattlePassNode";
import type { TshirtRewardClaim, TshirtRewardStatus } from "@/lib/rewards-api";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Package, PartyPopper, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type DeliveryStep = {
    status: TshirtRewardStatus;
    label: string;
    description: string;
    icon: LucideIcon;
};

const DELIVERY_STEPS: DeliveryStep[] = [
    {
        status: "pending",
        label: UI.tshirtDeliveryStepPreparing,
        description: UI.tshirtClaimPending,
        icon: Package,
    },
    {
        status: "shipped",
        label: UI.tshirtDeliveryStepShipping,
        description: UI.tshirtClaimShipped,
        icon: Truck,
    },
    {
        status: "delivered",
        label: UI.tshirtDeliveryStepDelivered,
        description: UI.tshirtClaimDelivered,
        icon: PartyPopper,
    },
];

function statusIndex(status: TshirtRewardStatus): number {
    return DELIVERY_STEPS.findIndex((step) => step.status === status);
}

function nodeStatusForDelivery(
    stepIndex: number,
    currentIndex: number,
    isComplete: boolean,
): BattlePassNodeStatus {
    if (isComplete) return "done";
    if (stepIndex < currentIndex) return "done";
    if (stepIndex === currentIndex) return "current";
    return "locked";
}

type TshirtDeliveryStepperProps = {
    claim: TshirtRewardClaim;
    className?: string;
};

export function TshirtDeliveryStepper({
    claim,
    className,
}: TshirtDeliveryStepperProps) {
    const currentIndex = Math.max(0, statusIndex(claim.status));
    const currentStep = DELIVERY_STEPS[currentIndex];
    const isComplete = claim.status === "delivered";
    const progressPct =
        DELIVERY_STEPS.length > 1
            ? isComplete
                ? 100
                : (currentIndex / (DELIVERY_STEPS.length - 1)) * 100
            : 0;

    const statusHint =
        claim.status === "shipped" && claim.trackingNumber
            ? `${currentStep.description} ${UI.tshirtDeliveryTrackingLabel} : ${claim.trackingNumber}`
            : currentStep.description;

    return (
        <div className={cn("space-y-3 border-t border-border pt-4", className)}>
            <p className="text-xs font-one-more uppercase italic text-foreground">
                {UI.tshirtDeliveryTrackingTitle}
            </p>

            <div className="relative px-1">
                <div className="absolute left-4 right-4 top-4 h-1 rounded-full bg-secondary" />
                <div
                    className="absolute left-4 top-4 h-1 rounded-full bg-accent transition-all duration-500"
                    style={{
                        width: `calc((100% - 2rem) * ${progressPct / 100})`,
                    }}
                />
                <div className="relative flex items-start justify-between">
                    {DELIVERY_STEPS.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <BattlePassNode
                                key={step.status}
                                label=""
                                sublabel={step.label}
                                status={nodeStatusForDelivery(
                                    index,
                                    currentIndex,
                                    isComplete,
                                )}
                                icon={<Icon className="size-3.5" />}
                                highlightSublabel
                                className="w-[4.5rem] sm:w-20"
                            />
                        );
                    })}
                </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
                {statusHint}
            </p>
        </div>
    );
}
