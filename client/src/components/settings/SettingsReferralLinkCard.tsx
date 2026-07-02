import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccess } from "@/hooks/use-access";
import { useReferralDrawer } from "@/hooks/use-referral-drawer";
import { UI } from "@/lib/translations";
import { Gift, Ticket } from "lucide-react";

export function SettingsReferralLinkCard() {
  const { openReferralDrawer } = useReferralDrawer();
  const { hasUsedReferralCode } = useAccess();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{UI.referralHubTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {UI.referralHubSettingsHint}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button
          className="w-full"
          onClick={() => openReferralDrawer("invite")}
        >
          <Gift className="mr-2 size-4" />
          {UI.settingsReferralInviteButton}
        </Button>
        {!hasUsedReferralCode ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => openReferralDrawer("apply")}
          >
            <Ticket className="mr-2 size-4" />
            {UI.settingsReferralApplyButton}
          </Button>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            {UI.referralCodeAlreadyUsed}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
