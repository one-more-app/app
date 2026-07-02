import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccess } from "@/hooks/use-access";
import { usePurchases } from "@/hooks/use-purchases";
import { UI } from "@/lib/translations";
import { Crown } from "lucide-react";

export function PremiumSettingsCard() {
  const { isPremium } = useAccess();
  const { available, busy, subscribe, restore } = usePurchases();

  if (!available) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{UI.premiumSettingsTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {isPremium
            ? UI.premiumActiveDescription
            : UI.premiumInactiveDescription}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {isPremium ? (
          <p className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-center text-sm font-medium text-foreground">
            {UI.premiumActiveBadge}
          </p>
        ) : (
          <Button
            className="w-full"
            disabled={busy}
            onClick={() => {
              void subscribe("settings");
            }}
          >
            <Crown className="mr-2 size-4" />
            {UI.premiumSubscribeButton}
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full"
          disabled={busy}
          onClick={() => {
            void restore();
          }}
        >
          {UI.premiumRestoreButton}
        </Button>
      </CardContent>
    </Card>
  );
}
