import { Button } from "@/components/ui/button";
import { useReferralDrawer } from "@/hooks/use-referral-drawer";
import { UI } from "@/lib/translations";
import { Users } from "lucide-react";

export function ReferralInviteButton() {
  const { openReferralDrawer } = useReferralDrawer();

  return (
    <Button
      className="w-full"
      variant="secondary"
      onClick={() => openReferralDrawer("invite")}
    >
      <Users className="mr-2 size-4" />
      {UI.profileInviteButton}
    </Button>
  );
}
