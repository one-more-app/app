export const DISCOVERY_SOURCES = [
  'app_store',
  'google_play',
  'google_web',
  'friends_family',
  'tiktok',
  'instagram',
  'influencer',
  'chatgpt_ai',
  'youtube',
  'other',
  'skipped',
] as const;

export type DiscoverySource = (typeof DISCOVERY_SOURCES)[number];
