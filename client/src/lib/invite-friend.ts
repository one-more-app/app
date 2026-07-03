import {
  fetchInviteCode,
  shareInviteCode,
  shareInviteMessage,
} from "@/lib/social-api";
import { UI } from "@/lib/translations";
import { toast } from "sonner";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.one_more.app";

function getAppleStoreUrl(): string {
  const appStoreId = String(import.meta.env.VITE_APPSFLYER_APP_ID ?? "").trim();
  if (/^\d+$/.test(appStoreId)) {
    return `https://apps.apple.com/app/id${appStoreId}`;
  }
  return "https://apps.apple.com/app";
}

function buildReferralShareMessage(code: string): string {
  const base = UI.inviteCodeShareMessage.replace("{code}", code.trim().toLowerCase());
  return `${base}\n\nApp Store (iOS): ${getAppleStoreUrl()}\nGoogle Play (Android): ${PLAY_STORE_URL}`;
}

export async function inviteFriend(): Promise<boolean> {
  try {
    const { code } = await fetchInviteCode();
    const message = buildReferralShareMessage(code);
    const result = await shareInviteMessage(message);
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
