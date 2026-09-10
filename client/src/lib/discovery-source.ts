export const DISCOVERY_SOURCES = [
  "app_store",
  "google_play",
  "google_web",
  "friends_family",
  "social",
  // Legacy (anciennes réponses UI, encore acceptées en API)
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

/** Sources sélectionnables dans l’UI (hors `skipped` et legacy réseaux). */
export type DiscoverySourceChoice =
  | "app_store"
  | "google_play"
  | "google_web"
  | "friends_family"
  | "social"
  | "chatgpt_ai"
  | "claude"
  | "gemini"
  | "perplexity"
  | "other";

export const DISCOVERY_SOURCE_CHOICES: DiscoverySourceChoice[] = [
  "app_store",
  "google_play",
  "google_web",
  "friends_family",
  "social",
  "chatgpt_ai",
  "claude",
  "gemini",
  "perplexity",
  "other",
];
