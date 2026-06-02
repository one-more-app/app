import { generateAppsFlyerInviteUrl } from "@/lib/appsflyer";
import { buildOneLinkInviteUrl } from "@/lib/appsflyer-config";
import type { InviteLink } from "@/lib/social-api";

/**
 * URL à partager : OneLink AppsFlyer si configuré, sinon URL renvoyée par l’API.
 */
export async function resolveInviteShareUrl(
  apiLink: InviteLink,
  referrerUserId?: string,
): Promise<string> {
  const generated = await generateAppsFlyerInviteUrl(
    apiLink.code,
    referrerUserId,
  );
  if (generated) return generated;

  const staticOneLink = buildOneLinkInviteUrl(apiLink.code);
  return staticOneLink ?? apiLink.url;
}
