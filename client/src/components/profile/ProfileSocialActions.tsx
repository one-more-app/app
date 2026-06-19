import { Button } from "@/components/ui/button";
import { useAccess } from "@/hooks/use-access";
import { copyInviteCode, inviteFriend } from "@/lib/invite-friend";
import { fetchInviteCode } from "@/lib/social-api";
import { UI } from "@/lib/translations";
import {
  EXERCISE_BONUS_PER_REFERRAL,
  EXERCISE_LIMIT_BASE,
} from "@one-more/shared/access-config";
import { Copy, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ProfileSocialActions() {
  const { referralCount, exerciseLimit } = useAccess();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [busy, setBusy] = useState<"share" | "copy" | null>(null);

  useEffect(() => {
    void fetchInviteCode()
      .then(({ code }) => setInviteCode(code))
      .catch(() => setInviteCode(null));
  }, []);

  const handleShare = () => {
    void (async () => {
      setBusy("share");
      try {
        await inviteFriend();
      } finally {
        setBusy(null);
      }
    })();
  };

  const handleCopy = () => {
    void (async () => {
      setBusy("copy");
      try {
        await copyInviteCode();
      } finally {
        setBusy(null);
      }
    })();
  };

  const handleCopyCodeOnly = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast.success(UI.inviteCodeCopied);
    } catch {
      toast.error(UI.inviteShareError);
    }
  };

  return (
    <div className="space-y-2">
      {referralCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          {UI.referralStats
            .replace("{count}", String(referralCount))
            .replace("{limit}", String(exerciseLimit ?? EXERCISE_LIMIT_BASE))}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {UI.referralBonusPerInvite.replace(
            "{bonus}",
            String(EXERCISE_BONUS_PER_REFERRAL),
          )}
        </p>
      )}

      {inviteCode ? (
        <button
          type="button"
          onClick={() => void handleCopyCodeOnly()}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-left"
        >
          <span className="text-xs text-muted-foreground">
            {UI.referralYourCodeLabel}
          </span>
          <span className="font-mono text-sm font-semibold tracking-wide">
            {inviteCode}
          </span>
        </button>
      ) : null}

      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={busy !== null}
          onClick={handleShare}
        >
          <Users className="mr-2 size-4" />
          {UI.profileInviteButton}
        </Button>
        <Button
          variant="secondary"
          disabled={busy !== null || !inviteCode}
          onClick={handleCopy}
          aria-label={UI.profileCopyInviteCode}
        >
          <Copy className="size-4" />
        </Button>
      </div>
    </div>
  );
}
