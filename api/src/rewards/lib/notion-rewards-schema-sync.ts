import {
  NOTION_REWARD_SIZE_OPTIONS,
  NOTION_REWARD_STATUS_OPTIONS,
  NOTION_REWARD_TYPE_OPTIONS,
} from './notion-rewards-constants.js';

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

const schemaSyncCache = new Map<string, number>();
const SCHEMA_SYNC_TTL_MS = 60 * 60 * 1000;

type NotionOption = { id?: string; name: string; color?: string };

type NotionPropertySchema = {
  type: string;
  select?: { options: NotionOption[] };
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
  required: readonly string[],
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

export function buildRewardsSchemaPatch(
  properties: Record<string, NotionPropertySchema>,
  statusDefault: string,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const statusOptions = [
    ...NOTION_REWARD_STATUS_OPTIONS,
    ...(statusDefault &&
    !NOTION_REWARD_STATUS_OPTIONS.includes(
      statusDefault as (typeof NOTION_REWARD_STATUS_OPTIONS)[number],
    )
      ? [statusDefault]
      : []),
  ];

  const typeProp = properties.Type;
  if (typeProp?.type === 'select' && typeProp.select) {
    const merged = mergeOptions(typeProp.select.options ?? [], [
      ...NOTION_REWARD_TYPE_OPTIONS,
    ]);
    if (merged) patch.Type = { select: { options: merged } };
  }

  const sizeProp = properties.Taille;
  if (sizeProp?.type === 'select' && sizeProp.select) {
    const merged = mergeOptions(sizeProp.select.options ?? [], [
      ...NOTION_REWARD_SIZE_OPTIONS,
    ]);
    if (merged) patch.Taille = { select: { options: merged } };
  }

  const status = properties.Statut;
  if (status?.type === 'status' && status.status) {
    const merged = mergeOptions(status.status.options ?? [], statusOptions);
    if (merged) patch.Statut = { status: { options: merged } };
  }

  return patch;
}

export async function ensureRewardsNotionDatabaseSchema(
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
      `Notion rewards schema sync: lecture base impossible (${getRes.status}).`,
    );
    return;
  }

  const db = (await getRes.json()) as {
    properties: Record<string, NotionPropertySchema>;
  };
  const patchProps = buildRewardsSchemaPatch(db.properties, statusDefault);

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
      `Notion rewards schema sync: PATCH options impossible (${patchRes.status}): ${text}`,
    );
    return;
  }

  schemaSyncCache.set(cacheKey, Date.now());
}
