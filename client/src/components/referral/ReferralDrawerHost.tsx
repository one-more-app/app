import { ReferralShareHero } from "@/components/profile/ReferralShareHero";
import { ReferralBattlePass } from "@/components/referral/ReferralBattlePass";
import { TshirtClaimDialog } from "@/components/settings/TshirtClaimDialog";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useAccess } from "@/hooks/use-access";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/hooks/use-auth";
import {
    useReferralDrawer,
    type ReferralDrawerSource,
} from "@/hooks/use-referral-drawer";
import { AnalyticsEvents } from "@/lib/analytics";
import { ApiError } from "@/lib/api";
import { hapticNotificationWarning } from "@/lib/haptics";
import {
    fetchTshirtRewardStatus,
    TSHIRT_REWARD_SWR_KEY,
} from "@/lib/rewards-api";
import { applyReferralCode, fetchInviteCode } from "@/lib/social-api";
import { UI } from "@/lib/translations";
import {
    EXERCISE_BONUS_FOR_USING_REFERRAL,
    EXERCISE_BONUS_PER_REFERRAL,
} from "@one-more/shared/access-config";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import useSWR from "swr";

function LimitBanner() {
    const hint = UI.referralLimitHint.replace(
        "{bonus}",
        String(EXERCISE_BONUS_PER_REFERRAL),
    );
    return (
        <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-foreground">
            {hint}
        </p>
    );
}

export function ReferralDrawerHost() {
    const auth = useAuth();
    const location = useLocation();
    const { open, source, closeReferralDrawer, openReferralDrawer } =
        useReferralDrawer();
    const { track } = useAnalytics();
    const {
        access,
        refresh,
        hasUsedReferralCode,
        referralCount,
        tshirtRewardEligible,
        referralsUntilTshirt,
    } = useAccess();

    const { data: tshirtReward, mutate: refreshTshirtReward } = useSWR(
        auth.status === "authenticated" ? TSHIRT_REWARD_SWR_KEY : null,
        fetchTshirtRewardStatus,
    );

    const [myCode, setMyCode] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState(false);
    const [claimDialogOpen, setClaimDialogOpen] = useState(false);
    const [applyOpen, setApplyOpen] = useState(false);

    useEffect(() => {
        if (!open) {
            setApplyOpen(false);
            setCode("");
            return;
        }
        if (source === "apply") {
            setApplyOpen(true);
        }
    }, [open, source]);

    useEffect(() => {
        if (location.hash !== "#referral") return;
        openReferralDrawer("invite");
        window.history.replaceState(
            null,
            "",
            `${location.pathname}${location.search}`,
        );
    }, [location.hash, location.pathname, location.search, openReferralDrawer]);

    useEffect(() => {
        if (!open) return;
        void fetchInviteCode()
            .then(({ code: inviteCode }) => setMyCode(inviteCode))
            .catch(() => setMyCode(null));
    }, [open]);

    useEffect(() => {
        if (!open || source !== "limit") return;
        void hapticNotificationWarning();
        track(AnalyticsEvents.PAYWALL_VIEWED, {
            paywall_type: "exercise_limit",
            active_count: access?.activeExerciseCount,
            exercise_limit: access?.exerciseLimit,
            referral_count: referralCount,
        });
        track(AnalyticsEvents.EXERCISE_LIMIT_REACHED, {
            active_count: access?.activeExerciseCount,
            exercise_limit: access?.exerciseLimit,
        });
    }, [open, source, access, referralCount, track]);

    const handleApply = () => {
        const trimmed = code.trim();
        if (!trimmed) return;

        void (async () => {
            setBusy(true);
            try {
                await applyReferralCode(trimmed);
                await refresh();
                setCode("");
                setApplyOpen(false);
                toast.success(UI.referralCodeApplied);
            } catch (error) {
                if (error instanceof ApiError) {
                    if (error.status === 409) {
                        toast.error(UI.referralCodeAlreadyUsed);
                    } else if (error.status === 400) {
                        toast.error(UI.referralCodeSelf);
                    } else if (error.status === 404) {
                        toast.error(UI.referralCodeInvalid);
                    } else {
                        toast.error(error.message || UI.referralCodeInvalid);
                    }
                } else {
                    toast.error(UI.referralCodeInvalid);
                }
            } finally {
                setBusy(false);
            }
        })();
    };

    const description =
        source === "apply"
            ? UI.referralApplyDrawerDescription.replace(
                "{bonus}",
                String(EXERCISE_BONUS_FOR_USING_REFERRAL),
            )
            : UI.referralDrawerShortDescription.replace(
                "{bonus}",
                String(EXERCISE_BONUS_FOR_USING_REFERRAL),
            );

    const drawerTitle = resolveDrawerTitle(source);
    const applyOnly = source === "apply";

    return (
        <>
            <Drawer
                open={open}
                onOpenChange={(next) => {
                    if (!next) closeReferralDrawer();
                }}
                analyticsLabel="referral"
            >
                <DrawerContent className="max-h-[92vh]">
                    <div className="mx-auto w-full max-w-lg overflow-y-auto px-4 pb-8">
                        <DrawerHeader className="px-0 text-left">
                            <DrawerTitle>{drawerTitle}</DrawerTitle>
                            <DrawerDescription>{description}</DrawerDescription>
                        </DrawerHeader>

                        <div className="space-y-4">
                            {source === "limit" ? <LimitBanner /> : null}

                            {applyOnly && !hasUsedReferralCode ? (
                                <div className="flex flex-col gap-2">
                                    <Input
                                        id="referral-code-drawer-apply"
                                        label={UI.referralCodeLabel}
                                        placeholder={UI.referralCodePlaceholder}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                    />
                                    <Button
                                        className="w-full"
                                        disabled={busy || code.trim().length < 4}
                                        onClick={handleApply}
                                    >
                                        {UI.referralCodeApply}
                                    </Button>
                                </div>
                            ) : null}

                            {applyOnly && hasUsedReferralCode ? (
                                <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center text-sm text-muted-foreground">
                                    {UI.referralCodeAlreadyUsed}
                                </p>
                            ) : null}

                            {!applyOnly ? (
                                <>
                                    <ReferralShareHero inviteCode={myCode} referralCount={referralCount} />

                                    <ReferralBattlePass
                                        referralCount={referralCount}
                                        tshirtRewardEligible={tshirtRewardEligible}
                                        referralsUntilTshirt={referralsUntilTshirt}
                                        claim={tshirtReward?.claim ?? null}
                                        onClaimTshirt={() => setClaimDialogOpen(true)}
                                    />
                                </>
                            ) : null}

                            {!applyOnly && !hasUsedReferralCode ? (
                                <div className="border-t border-border pt-3">
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-between text-sm text-muted-foreground"
                                        onClick={() => setApplyOpen((value) => !value)}
                                    >
                                        {UI.referralApplyCodeToggle}
                                        <ChevronDown
                                            className={`size-4 transition-transform ${applyOpen ? "rotate-180" : ""}`}
                                        />
                                    </button>
                                    {applyOpen ? (
                                        <div className="mt-3 flex flex-col gap-2">
                                            <Input
                                                id="referral-code-drawer"
                                                label={UI.referralCodeLabel}
                                                placeholder={UI.referralCodePlaceholder}
                                                value={code}
                                                onChange={(e) => setCode(e.target.value)}
                                                autoCapitalize="none"
                                                autoCorrect="off"
                                            />
                                            <Button
                                                className="w-full"
                                                disabled={busy || code.trim().length < 4}
                                                onClick={handleApply}
                                            >
                                                {UI.referralCodeApply}
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>

            <TshirtClaimDialog
                open={claimDialogOpen}
                onOpenChange={setClaimDialogOpen}
                onClaimed={() => void refreshTshirtReward()}
            />
        </>
    );
}

function resolveDrawerTitle(source: ReferralDrawerSource | null): string {
    if (source === "limit") return UI.exerciseLimitTitle;
    if (source === "apply") return UI.referralApplyDrawerTitle;
    return UI.referralHubTitle;
}
