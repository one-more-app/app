import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAccess } from "@/hooks/use-access";
import { ApiError } from "@/lib/api";
import { applyReferralCode } from "@/lib/social-api";
import { UI } from "@/lib/translations";
import {
  EXERCISE_BONUS_FOR_USING_REFERRAL,
  EXERCISE_BONUS_PER_REFERRAL,
  EXERCISE_LIMIT_BASE,
} from "@one-more/shared/access-config";
import { useState } from "react";
import { toast } from "sonner";

export function ReferralSettingsCard() {
  const {
    access,
    refresh,
    hasUsedReferralCode,
    referralCount,
    exerciseLimit,
  } = useAccess();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

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

  const bonusHint = UI.referralBonusPerInvite.replace(
    "{bonus}",
    String(EXERCISE_BONUS_PER_REFERRAL),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{UI.referralSettingsTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{statsText}</p>
        <p className="text-xs text-muted-foreground">{bonusHint}</p>

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
