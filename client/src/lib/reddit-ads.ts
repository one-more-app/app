const PENDING_REDDIT_ADS_KEY = "one-more-pending-reddit-ads-v1";

export type RedditAdsMatch = {
  redditClickId?: string | null;
  idfa?: string | null;
  aaid?: string | null;
};

function normalizeMatch(input: RedditAdsMatch): RedditAdsMatch {
  return {
    redditClickId: input.redditClickId?.trim() ? input.redditClickId.trim() : null,
    idfa: input.idfa?.trim() ? input.idfa.trim() : null,
    aaid: input.aaid?.trim() ? input.aaid.trim() : null,
  };
}

function isEmpty(match: RedditAdsMatch): boolean {
  return !match.redditClickId && !match.idfa && !match.aaid;
}

export function extractRedditClickIdFromUrl(input: string): string | null {
  try {
    const url = new URL(input);
    const fromQuery =
      url.searchParams.get("rdt_cid") ?? url.searchParams.get("click_id");
    if (fromQuery?.trim()) return fromQuery.trim();

    const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
    if (hash.includes("?")) {
      const qs = hash.slice(hash.indexOf("?") + 1);
      const params = new URLSearchParams(qs);
      const fromHash = params.get("rdt_cid") ?? params.get("click_id");
      if (fromHash?.trim()) return fromHash.trim();
    }
    return null;
  } catch {
    return null;
  }
}

export function peekRedditAdsMatch(): RedditAdsMatch | null {
  try {
    const raw = localStorage.getItem(PENDING_REDDIT_ADS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RedditAdsMatch;
    if (!parsed || typeof parsed !== "object") return null;
    const normalized = normalizeMatch(parsed);
    return isEmpty(normalized) ? null : normalized;
  } catch {
    return null;
  }
}

export function setRedditAdsMatch(input: RedditAdsMatch): void {
  try {
    const incoming = normalizeMatch(input);
    if (isEmpty(incoming)) return;
    const existing = peekRedditAdsMatch() ?? {};
    const next = normalizeMatch({
      redditClickId: existing.redditClickId ?? incoming.redditClickId,
      idfa: existing.idfa ?? incoming.idfa,
      aaid: existing.aaid ?? incoming.aaid,
    });
    localStorage.setItem(PENDING_REDDIT_ADS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function captureRedditClickIdFromUrl(input?: string): void {
  if (typeof window === "undefined" && input == null) return;
  const href = input ?? window.location.href;
  const clickId = extractRedditClickIdFromUrl(href);
  if (clickId) setRedditAdsMatch({ redditClickId: clickId });
}

/** Champs à merger dans le body register / oauth. */
export function redditAdsBodyFields(): {
  redditClickId?: string;
  idfa?: string;
  aaid?: string;
} {
  const pending = peekRedditAdsMatch();
  if (!pending) return {};
  return {
    ...(pending.redditClickId ? { redditClickId: pending.redditClickId } : {}),
    ...(pending.idfa ? { idfa: pending.idfa } : {}),
    ...(pending.aaid ? { aaid: pending.aaid } : {}),
  };
}
