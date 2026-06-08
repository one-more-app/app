import { resolveInviteShareUrl } from "@/lib/invite-link";
import { fetchInviteLink, shareInviteUrl } from "@/lib/social-api";
import { UI } from "@/lib/translations";
import { toast } from "sonner";

export async function inviteFriend(referrerUserId?: string): Promise<boolean> {
  try {
    const link = await fetchInviteLink();
    const shareUrl = await resolveInviteShareUrl(link, referrerUserId);
    const result = await shareInviteUrl(shareUrl);
    if (result === "dismissed") return false;
    toast.success(
      result === "copied" ? UI.inviteLinkCopied : UI.inviteLinkShared,
    );
    return true;
  } catch {
    toast.error(UI.inviteShareError);
    return false;
  }
}
