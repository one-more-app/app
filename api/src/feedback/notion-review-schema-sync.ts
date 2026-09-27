import { reviewChipNotionOptionNames } from './review-chip-labels.js';

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

const REVIEW_PLATFORMS = ['ios', 'android', 'web'] as const;
const REVIEW_CHIP_OPTIONS = reviewChipNotionOptionNames();

const schemaSyncCache = new Map<string, number>();
const SCHEMA_SYNC_TTL_MS = 60 * 60 * 1000;

type NotionOption = { id?: string; name: string; color?: string };

type NotionPropertySchema = {
  type: string;
  select?: { options: NotionOption[] };
  multi_select?: { options: NotionOption[] };
  status?: { options: NotionOption[] };
};

function notionHeaders(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    'notion-version': NOTION_VERSION,
  };
}

function mergeOptions(
  existing: NotionOption[],
  required: string[],
): NotionOption[] | null {
  const names = new Set(existing.map((o) => o.name));
  const missing = required.filter((r) => !names.has(r));
  if (missing.length === 0) return null;
  return [
    ...existing.map((o) => ({
      ...(o.id ? { id: o.id } : {}),
      name: o.name,
      color: o.color ?? 'default',
    })),
    ...missing.map((name) => ({ name, color: 'default' as const })),
  ];
}

export function buildReviewSchemaPatch(
  properties: Record<string, NotionPropertySchema>,
  statusDefault: string,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  const platform = properties.Platform;
  if (platform?.type === 'select' && platform.select) {
    const merged = mergeOptions(platform.select.options ?? [], [
      ...REVIEW_PLATFORMS,
    ]);
    if (merged) patch.Platform = { select: { options: merged } };
  }

  const chips = properties.Chips;
  if (chips?.type === 'multi_select' && chips.multi_select) {
    const merged = mergeOptions(
      chips.multi_select.options ?? [],
      REVIEW_CHIP_OPTIONS,
    );
    if (merged) patch.Chips = { multi_select: { options: merged } };
  }

  const status = properties.Status;
  if (status?.type === 'status' && status.status) {
    const merged = mergeOptions(status.status.options ?? [], [statusDefault]);
    if (merged) patch.Status = { status: { options: merged } };
  }

  return patch;
}

export async function ensureReviewNotionDatabaseSchema(
  token: string,
  databaseId: string,
  statusDefault: string,
  log?: { warn: (message: string) => void },
): Promise<void> {
  const cacheKey = `${databaseId}:${statusDefault}`;
  const cachedAt = schemaSyncCache.get(cacheKey) ?? 0;
  if (Date.now() - cachedAt < SCHEMA_SYNC_TTL_MS) return;

  const getRes = await fetch(`${NOTION_API_BASE}/databases/${databaseId}`, {
    headers: notionHeaders(token),
  });
  if (!getRes.ok) {
    log?.warn(
      `Notion schema sync: lecture base impossible (${getRes.status}).`,
    );
    return;
  }

  const db = (await getRes.json()) as {
    properties: Record<string, NotionPropertySchema>;
  };
  const patchProps = buildReviewSchemaPatch(db.properties, statusDefault);

  if (Object.keys(patchProps).length === 0) {
    schemaSyncCache.set(cacheKey, Date.now());
    return;
  }

  const patchRes = await fetch(`${NOTION_API_BASE}/databases/${databaseId}`, {
    method: 'PATCH',
    headers: notionHeaders(token),
    body: JSON.stringify({ properties: patchProps }),
  });

  if (!patchRes.ok) {
    const text = await patchRes.text();
    log?.warn(
      `Notion schema sync: PATCH options impossible (${patchRes.status}): ${text}`,
    );
    return;
  }

  schemaSyncCache.set(cacheKey, Date.now());
}
