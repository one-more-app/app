import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { resolveInviteShareUrl } from "@/lib/invite-link";
import { fetchInviteLink, shareInviteUrl } from "@/lib/social-api";
import { shareProfilePng } from "@/lib/share-profile";
import type { ProfileSharePayload } from "@/lib/share-profile";
import { UI } from "@/lib/translations";
import { Share2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ProfileSocialActionsProps = {
  sharePayload: ProfileSharePayload | null;
  isDark: boolean;
  showUnlockHint?: boolean;
  validatedInvitesCount?: number;
};

export function ProfileSocialActions({
  sharePayload,
  isDark,
  showUnlockHint = false,
  validatedInvitesCount = 0,
}: ProfileSocialActionsProps) {
  const auth = useAuth();
  const [busy, setBusy] = useState<"share" | "invite" | null>(null);

  const handleShareProfile = () => {
    if (!sharePayload) return;
    void (async () => {
      setBusy("share");
      try {
        const link = await fetchInviteLink();
        const mode = await shareProfilePng(sharePayload, isDark);
        if (mode === "shared") {
          toast.success(UI.profileShareSuccess);
        } else {
          toast.success(UI.profileShareDownloaded);
        }
        void navigator.clipboard?.writeText(link.url);
      } catch {
        toast.error(UI.profileShareError);
      } finally {
        setBusy(null);
      }
    })();
  };

  const handleInvite = () => {
    void (async () => {
      setBusy("invite");
      try {
        const link = await fetchInviteLink();
        const shareUrl = await resolveInviteShareUrl(
          link,
          auth.user?.id,
        );
        const result = await shareInviteUrl(shareUrl);
        toast.success(
          result === "copied" ? UI.inviteLinkCopied : UI.inviteLinkShared,
        );
      } catch {
        toast.error(UI.inviteShareError);
      } finally {
        setBusy(null);
      }
    })();
  };

  return (
    <div className="space-y-2">
      {showUnlockHint ? (
        <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {validatedInvitesCount > 0
            ? UI.accessUnlockPending
            : UI.accessUnlockHint}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          disabled={!sharePayload || busy !== null}
          onClick={handleShareProfile}
        >
          <Share2 className="mr-2 size-4" />
          {UI.profileShareButton}
        </Button>
        <Button
          size="sm"
          className="flex-1"
          disabled={busy !== null}
          onClick={handleInvite}
        >
          <Users className="mr-2 size-4" />
          {UI.profileInviteButton}
        </Button>
      </div>
    </div>
  );
}
