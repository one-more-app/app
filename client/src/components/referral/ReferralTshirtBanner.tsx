import { ProRewardVisual } from "@/components/referral/ProRewardVisual";
import { useAccess } from "@/hooks/use-access";
import { useReferralDrawer } from "@/hooks/use-referral-drawer";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

const TSHIRT_IMAGES = {
    dark: "/images/rewards/tshirt-black.png",
} as const;

export function ReferralTshirtBanner({ className }: { className?: string }) {
    const { openReferralDrawer } = useReferralDrawer();
    const { referralRewardKind, tshirtRewardEligible } = useAccess();
    const showTshirt =
        referralRewardKind === "tshirt" || tshirtRewardEligible;
    const src = TSHIRT_IMAGES.dark;

    return (
        <button
            type="button"
            onClick={() => openReferralDrawer("invite")}
            className={cn(
                "group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-accent via-accent/80 to-card py-2 px-4 text-left transition-colors",
                className,
            )}
        >
            <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-one-more uppercase italic leading-snug text-accent-foreground">
                        {showTshirt
                            ? UI.referralBattlePassTitleTshirt
                            : UI.profileReferralBannerTitle}
                    </p>
                    <p className="text-xs text-accent-foreground/80">
                        {showTshirt
                            ? "5 potes parrainés = t-shirt One More offert"
                            : UI.profileReferralBannerSubtitle}
                    </p>
                </div>

                <div className="flex items-center gap-0">
                    {showTshirt ? (
                        <div className="relative flex w-32 shrink-0 items-center justify-center">
                            <img
                                src={src}
                                alt=""
                                aria-hidden
                                className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                    ) : (
                        <div className="shrink-0">
                            <ProRewardVisual compact />
                        </div>
                    )}

                    <ChevronRight
                        className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                        aria-hidden
                    />
                </div>
            </div>
        </button>
    );
}
