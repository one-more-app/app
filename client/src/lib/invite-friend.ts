import { Capacitor } from "@capacitor/core";
import { trackFriendInviteSent } from "@/lib/analytics";
import { buildOneLinkInviteUrl } from "@/lib/appsflyer-config";
import { fetchInviteCode } from "@/lib/social-api";
import { UI } from "@/lib/translations";
import { toast } from "sonner";

function isShareCancelled(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /cancel/i.test(message);
}

async function resolveInviteCode(code?: string): Promise<string> {
  const fromArg = code?.trim().toLowerCase();
  if (fromArg) return fromArg;
  const { code: fetched } = await fetchInviteCode();
  return fetched.trim().toLowerCase();
}

async function copyText(text: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Clipboard } = await import("@capacitor/clipboard");
      await Clipboard.write({ string: text });
      return;
    } catch {
      // fallback web API
    }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error("Copie impossible");
}

function buildShareMessage(inviteCode: string, url: string): string {
  return `${UI.inviteCodeShareMessage.replace("{code}", inviteCode)}\n\n${url}`;
}

/**
 * Partager mon invitation : message + OneLink via Capacitor Share.
 * Si le sheet échoue → copie le même texte (stable).
 */
export async function inviteFriend(code?: string): Promise<boolean> {
  try {
    const inviteCode = await resolveInviteCode(code);
    const url = buildOneLinkInviteUrl(inviteCode);
    if (!url) {
      toast.error(UI.inviteShareError);
      return false;
    }

    const message = buildShareMessage(inviteCode, url);

    try {
      if (Capacitor.isNativePlatform()) {
        const { Share } = await import("@capacitor/share");
        await Share.share({
          title: UI.inviteShareTitle,
          text: message,
          dialogTitle: UI.inviteShareDialogTitle,
        });
        trackFriendInviteSent({ method: "native" });
      } else if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: UI.inviteShareTitle,
          text: message,
        });
        trackFriendInviteSent({ method: "web" });
      } else {
        await copyText(message);
        trackFriendInviteSent({ method: "clipboard" });
        toast.success(UI.inviteLinkCopied);
        return true;
      }
      toast.success(UI.inviteLinkShared);
      return true;
    } catch (error) {
      if (isShareCancelled(error)) return false;
      await copyText(message);
      trackFriendInviteSent({ method: "clipboard" });
      toast.success(UI.inviteLinkCopied);
      return true;
    }
  } catch {
    toast.error(UI.inviteShareError);
    return false;
  }
}

/** Copier : uniquement le code de parrainage. */
export async function copyInviteCode(code?: string): Promise<boolean> {
  try {
    const inviteCode = await resolveInviteCode(code);
    await copyText(inviteCode);
    trackFriendInviteSent({ method: "copy_code" });
    toast.success(UI.inviteCodeCopied);
    return true;
  } catch {
    toast.error(UI.inviteShareError);
    return false;
  }
}
