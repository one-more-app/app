import { fetchInviteCode, shareInviteCode } from "@/lib/social-api";
import { UI } from "@/lib/translations";
import { toast } from "sonner";

export async function inviteFriend(): Promise<boolean> {
  try {
    const { code } = await fetchInviteCode();
    const result = await shareInviteCode(code);
    if (result === "dismissed") return false;
    toast.success(
      result === "copied" ? UI.inviteCodeCopied : UI.inviteCodeShared,
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
