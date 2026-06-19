import { Trackable } from "@/components/analytics/Trackable";
import { useAnalytics } from "@/hooks/use-analytics";
import { AnalyticsEvents } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAccess } from "@/hooks/use-access";
import { inviteFriend } from "@/lib/invite-friend";
import { UI } from "@/lib/translations";
import {
  EXERCISE_BONUS_PER_REFERRAL,
  EXERCISE_LIMIT_BASE,
} from "@one-more/shared/access-config";
import { Users } from "lucide-react";
import { hapticNotificationWarning } from "@/lib/haptics";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type ExerciseLimitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount?: number;
  exerciseLimit?: number;
};

export function ExerciseLimitDialog({
  open,
  onOpenChange,
  activeCount = EXERCISE_LIMIT_BASE,
  exerciseLimit = EXERCISE_LIMIT_BASE,
}: ExerciseLimitDialogProps) {
  const { referralCount } = useAccess();
  const { track } = useAnalytics();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    void hapticNotificationWarning();
    track(AnalyticsEvents.PAYWALL_VIEWED, {
      paywall_type: "exercise_limit",
      active_count: activeCount,
      exercise_limit: exerciseLimit,
      referral_count: referralCount,
    });
    track(AnalyticsEvents.EXERCISE_LIMIT_REACHED, {
      active_count: activeCount,
      exercise_limit: exerciseLimit,
    });
  }, [open, activeCount, exerciseLimit, referralCount, track]);

  const handleInviteCode = () => {
    void (async () => {
      setBusy(true);
      try {
        const ok = await inviteFriend();
        if (ok) onOpenChange(false);
      } finally {
        setBusy(false);
      }
    })();
  };

  const handleViewFriends = () => {
    onOpenChange(false);
    navigate("/friends");
  };

  const description = UI.exerciseLimitDescription
    .replace("{count}", String(activeCount))
    .replace("{limit}", String(exerciseLimit))
    .replace("{bonus}", String(EXERCISE_BONUS_PER_REFERRAL));

  return (
    <Trackable section="paywall" feature="exercise_limit">
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{UI.exerciseLimitTitle}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            onClick={handleInviteCode}
            disabled={busy}
            data-analytics-label="invite_code"
          >
            <Users className="mr-2 size-4" />
            {UI.exerciseLimitInviteLink}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleViewFriends}
            disabled={busy}
            data-analytics-label="view_friends"
          >
            <Users className="mr-2 size-4" />
            {UI.exerciseLimitSearchFriend}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            {UI.cancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </Trackable>
  );
}
