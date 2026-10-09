const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

type NotionRichText = { plain_text?: string };
type NotionProperty = {
  type?: string;
  status?: { name?: string | null } | null;
  rich_text?: NotionRichText[];
};

export type ParsedRewardsNotionPage = {
  pageId: string;
  databaseId: string | null;
  statusName: string | null;
  claimId: string | null;
};

function normalizeNotionId(id: string): string {
  return id.replace(/-/g, '').toLowerCase();
}

export function notionIdsEqual(a: string, b: string): boolean {
  return normalizeNotionId(a) === normalizeNotionId(b);
}

function readRichText(prop: NotionProperty | undefined): string | null {
  const parts = prop?.rich_text ?? [];
  const text = parts
    .map((p) => p.plain_text ?? '')
    .join('')
    .trim();
  return text || null;
}

function readStatusName(prop: NotionProperty | undefined): string | null {
  const name = prop?.status?.name?.trim();
  return name || null;
}

export function parseRewardsNotionPage(
  pageId: string,
  body: unknown,
): ParsedRewardsNotionPage | null {
  if (!body || typeof body !== 'object') return null;
  const page = body as {
    id?: string;
    parent?: { type?: string; database_id?: string };
    properties?: Record<string, NotionProperty>;
  };

  const properties = page.properties ?? {};
  const parentDb =
    page.parent?.type === 'database_id' ? page.parent.database_id : null;

  return {
    pageId: page.id ?? pageId,
    databaseId: parentDb ?? null,
    statusName: readStatusName(properties.Statut),
    claimId: readRichText(properties['Claim ID']),
  };
}

export async function fetchNotionRewardsPage(
  notionToken: string,
  pageId: string,
): Promise<ParsedRewardsNotionPage | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${NOTION_API_BASE}/pages/${pageId}`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${notionToken}`,
        'notion-version': NOTION_VERSION,
      },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const json: unknown = await response.json();
    return parseRewardsNotionPage(pageId, json);
  } finally {
    clearTimeout(timeout);
  }
}
