import type { Request } from 'express';
import { extractRedditAdsContext } from '../analytics/reddit-conversions.js';

export function redditAdsFromRequest(
  req: Request,
  body: { redditClickId?: string; idfa?: string; aaid?: string },
) {
  return extractRedditAdsContext({
    headers: req.headers as Record<
      string,
      string | string[] | number | undefined
    >,
    ip: req.ip ?? req.socket?.remoteAddress,
    bodyClickId: body.redditClickId,
    bodyIdfa: body.idfa,
    bodyAaid: body.aaid,
  });
}
