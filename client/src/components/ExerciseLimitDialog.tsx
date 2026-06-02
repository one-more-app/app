import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { inviteFriend } from "@/lib/invite-friend";
import { UI } from "@/lib/translations";
import { EXERCISE_LIMIT_LIMITED } from "@one-more/shared/access-config";
import { Users } from "lucide-react";
import { useState } from "react";

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
  const [busy, setBusy] = useState(false);

  const handleInvite = () => {
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
          <Button className="w-full" onClick={handleInvite} disabled={busy}>
            <Users className="mr-2 size-4" />
            {UI.profileInviteButton}
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
