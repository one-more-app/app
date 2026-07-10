import type { TshirtRewardType } from "@/lib/rewards-api";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";

const TSHIRT_IMAGES = {
    dark: "/images/rewards/tshirt-black.png",
    light: "/images/rewards/tshirt-white.png",
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
    const showBoth = rewardType === "annual_classic_pack";

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center",
                highlight &&
                    "rounded-xl border border-accent/30 bg-accent/5 p-3",
                className,
            )}
        >
            <div
                className={cn(
                    "relative flex w-full items-center justify-center",
                    showBoth
                        ? "h-32 gap-3 sm:h-36"
                        : "h-28 sm:h-32",
                )}
            >
                {showBoth ? (
                    <>
                        <img
                            src={TSHIRT_IMAGES.dark}
                            alt={UI.referralTshirtImageAlt}
                            className="max-h-full max-w-[min(48%,140px)] object-contain drop-shadow-sm"
                        />
                        <img
                            src={TSHIRT_IMAGES.light}
                            alt={UI.referralTshirtImageAlt}
                            className="max-h-full max-w-[min(48%,140px)] object-contain drop-shadow-sm"
                        />
                    </>
                ) : (
                    <img
                        src={TSHIRT_IMAGES.dark}
                        alt={UI.referralTshirtImageAlt}
                        className="max-h-full max-w-[min(100%,220px)] object-contain drop-shadow-sm"
                    />
                )}
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
