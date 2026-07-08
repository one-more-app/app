import { useReferralDrawer } from "@/hooks/use-referral-drawer";
import { UI } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

const TSHIRT_IMAGES = {
    dark: "/images/rewards/tshirt-black.png",
    light: "/images/rewards/tshirt-white.png",
} as const;

export function ReferralTshirtBanner({ className }: { className?: string }) {
    const { openReferralDrawer } = useReferralDrawer();
    const src = TSHIRT_IMAGES.light;

    return (
        <button
            type="button"
            onClick={() => openReferralDrawer("invite")}
            className={cn(
                "group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-accent via-accent/80 to-card py-& px-4 text-left transition-colors",
                className,
            )}
        >
            <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-one-more uppercase italic leading-snug text-accent-foreground">
                        {UI.profileReferralBannerTitle}
                    </p>
                    <p className="text-xs text-accent-foreground/80">
                        {UI.profileReferralBannerSubtitle}
                    </p>
                </div>

                <div className="flex items-center gap-0">
                    <div className="relative flex w-32 shrink-0 items-center justify-center">
                        <img
                            src={src}
                            alt=""
                            aria-hidden
                            className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>

                    <ChevronRight
                        className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                        aria-hidden
                    />
                </div>
            </div>
        </button>
    );
}
