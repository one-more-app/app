import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAccess } from "@/hooks/use-access";
import { ApiError } from "@/lib/api";
import { copyInviteCode, inviteFriend } from "@/lib/invite-friend";
import { applyReferralCode, fetchInviteCode } from "@/lib/social-api";
import { UI } from "@/lib/translations";
import {
  EXERCISE_BONUS_FOR_USING_REFERRAL,
  EXERCISE_BONUS_PER_REFERRAL,
  EXERCISE_LIMIT_BASE,
} from "@one-more/shared/access-config";
import { Copy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ReferralSettingsCard() {
  const {
    access,
    refresh,
    hasUsedReferralCode,
    referralCount,
    exerciseLimit,
    isPremium,
    tshirtRewardEligible,
    referralsUntilTshirt,
  } = useAccess();
  const [code, setCode] = useState("");
  const [myCode, setMyCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchInviteCode()
      .then(({ code: inviteCode }) => setMyCode(inviteCode))
      .catch(() => setMyCode(null));
  }, []);

  const handleApply = () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    void (async () => {
      setBusy(true);
      try {
        await applyReferralCode(trimmed);
        await refresh();
        setCode("");
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

  const statsText = UI.referralStats
    .replace("{count}", String(referralCount))
    .replace("{limit}", String(exerciseLimit ?? access?.exerciseLimit ?? EXERCISE_LIMIT_BASE));

  const description = UI.referralSettingsDescription.replace(
    "{bonus}",
    String(EXERCISE_BONUS_FOR_USING_REFERRAL),
  );

  const yourCodeDescription = UI.referralYourCodeDescription.replace(
    "{bonus}",
    String(EXERCISE_BONUS_PER_REFERRAL),
  );

  const bonusHint = UI.referralBonusPerInvite.replace(
    "{bonus}",
    String(EXERCISE_BONUS_PER_REFERRAL),
  );

  const tshirtMessage = tshirtRewardEligible
    ? UI.referralTshirtEarned
    : isPremium && referralsUntilTshirt != null
      ? UI.referralTshirtProgress.replace("{count}", String(referralsUntilTshirt))
      : !isPremium
        ? UI.referralTshirtPremiumHint
        : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{UI.referralSettingsTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-sm text-muted-foreground">{yourCodeDescription}</p>
          {myCode ? (
            <button
              type="button"
              onClick={() => void copyInviteCode()}
              className="flex w-full items-center justify-between rounded-md bg-background px-3 py-2 text-left"
            >
              <span className="text-xs text-muted-foreground">
                {UI.referralYourCodeLabel}
              </span>
              <span className="font-mono text-sm font-semibold tracking-wide">
                {myCode}
              </span>
            </button>
          ) : null}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              variant="secondary"
              disabled={busy || !myCode}
              onClick={() => void inviteFriend()}
            >
              <Users className="mr-2 size-4" />
              {UI.profileInviteButton}
            </Button>
            <Button
              variant="outline"
              disabled={busy || !myCode}
              onClick={() => void copyInviteCode()}
              aria-label={UI.profileCopyInviteCode}
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{statsText}</p>
        <p className="text-xs text-muted-foreground">{bonusHint}</p>
        {tshirtMessage ? (
          <p className="text-xs text-muted-foreground">{tshirtMessage}</p>
        ) : null}

        {hasUsedReferralCode ? (
          <p className="text-sm font-medium text-foreground">
            {UI.referralCodeAlreadyUsed}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <Input
              id="referral-code"
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
        )}
      </CardContent>
    </Card>
  );
}
