import type { TshirtRewardType } from "@/lib/rewards-api";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";

const TSHIRT_IMAGES = {
    referral: "/images/rewards/tshirt-black.png",
    annual: "/images/abonnement mensual t shirts.png",
} as const;

type TshirtRewardVisualProps = {
    rewardType?: TshirtRewardType;
    highlight?: boolean;
    showSlogan?: boolean;
    className?: string;
};

export function TshirtRewardVisual({
    rewardType = "referral_limited",
    highlight = false,
    showSlogan = true,
    className,
}: TshirtRewardVisualProps) {
    const isAnnual = rewardType === "annual_classic_pack";
    const imageSrc = isAnnual ? TSHIRT_IMAGES.annual : TSHIRT_IMAGES.referral;

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center",
                highlight &&
                "rounded-xl p-3",
                className,
            )}
        >
            <div
                className={cn(
                    "relative flex w-full items-center justify-center",
                    isAnnual ? "h-36 sm:h-40" : "h-28 sm:h-32",
                )}
            >
                <img
                    src={imageSrc}
                    alt={UI.referralTshirtImageAlt}
                    className={cn(
                        "max-h-full object-contain drop-shadow-sm",
                        isAnnual
                            ? "max-w-[min(100%,280px)]"
                            : "max-w-[min(100%,220px)]",
                    )}
                />
            </div>
            {showSlogan ? (
                <>
                    <p className="mt-1 text-center text-[10px] font-one-more uppercase italic tracking-[0.25em] text-muted-foreground">
                        {UI.referralTshirtSloganOutline}
                    </p>
                    <p className="text-center text-sm font-one-more uppercase italic tracking-wide text-foreground">
                        {UI.referralTshirtSloganBold}
                    </p>
                </>
            ) : null}
        </div>
    );
}
