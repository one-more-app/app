import { fetchInviteLink, shareInviteLink } from "@/lib/social-api";
import { UI } from "@/lib/translations";
import { toast } from "sonner";

export async function inviteFriend(): Promise<boolean> {
  try {
    const link = await fetchInviteLink();
    const result = await shareInviteLink(link);
    toast.success(
      result === "copied" ? UI.inviteLinkCopied : UI.inviteLinkShared,
    );
    return true;
  } catch {
    toast.error(UI.inviteShareError);
    return false;
  }
}
