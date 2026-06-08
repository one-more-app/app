import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { inviteFriend } from "@/lib/invite-friend";
import { UI } from "@/lib/translations";
import { EXERCISE_LIMIT_LIMITED } from "@one-more/shared/access-config";
import { Link2, Search } from "lucide-react";
import { hapticNotificationWarning } from "@/lib/haptics";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type ExerciseLimitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount?: number;
};

export function ExerciseLimitDialog({
  open,
  onOpenChange,
  activeCount = EXERCISE_LIMIT_LIMITED,
}: ExerciseLimitDialogProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) void hapticNotificationWarning();
  }, [open]);

  const handleInviteLink = () => {
    void (async () => {
      setBusy(true);
      try {
        const ok = await inviteFriend(auth.user?.id);
        if (ok) onOpenChange(false);
      } finally {
        setBusy(false);
      }
    })();
  };

  const handleSearchFriend = () => {
    onOpenChange(false);
    navigate("/friends?tab=search");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{UI.exerciseLimitTitle}</DialogTitle>
          <DialogDescription>
            {UI.exerciseLimitDescription.replace(
              "{count}",
              String(activeCount),
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full" onClick={handleInviteLink} disabled={busy}>
            <Link2 className="mr-2 size-4" />
            {UI.exerciseLimitInviteLink}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleSearchFriend}
            disabled={busy}
          >
            <Search className="mr-2 size-4" />
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
  );
}
