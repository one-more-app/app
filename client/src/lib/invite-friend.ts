import { readStoredSession } from "@/lib/auth";
import { resolveInviteShareUrl } from "@/lib/invite-link";
import {
  fetchInviteCode,
  fetchInviteLink,
  shareInviteCode,
  shareInviteUrl,
} from "@/lib/social-api";
import { UI } from "@/lib/translations";
import { toast } from "sonner";

export async function inviteFriend(): Promise<boolean> {
  try {
    const session = readStoredSession();
    const link = await fetchInviteLink();
    const shareUrl = await resolveInviteShareUrl(link, session?.user.id);
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

export async function copyInviteCode(): Promise<boolean> {
  try {
    const { code } = await fetchInviteCode();
    const result = await shareInviteCode(code);
    if (result === "dismissed") return false;
    toast.success(UI.inviteCodeCopied);
    return true;
  } catch {
    toast.error(UI.inviteShareError);
    return false;
  }
}
