export const DISCOVERY_SOURCES = [
  "app_store",
  "google_play",
  "google_web",
  "friends_family",
  "tiktok",
  "instagram",
  "youtube",
  "influencer",
  "chatgpt_ai",
  "claude",
  "gemini",
  "perplexity",
  "other",
  "skipped",
] as const;

export type DiscoverySource = (typeof DISCOVERY_SOURCES)[number];

/** Sources sélectionnables dans l’UI (hors `skipped`). */
export type DiscoverySourceChoice = Exclude<DiscoverySource, "skipped">;

export const DISCOVERY_SOURCE_CHOICES: DiscoverySourceChoice[] = [
  "app_store",
  "google_play",
  "google_web",
  "friends_family",
  "tiktok",
  "instagram",
  "youtube",
  "influencer",
  "chatgpt_ai",
  "claude",
  "gemini",
  "perplexity",
  "other",
];
