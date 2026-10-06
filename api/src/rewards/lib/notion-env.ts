import type { ConfigService } from '@nestjs/config';

export function readNotionEnv(config: ConfigService, key: string): string {
  const raw = config.get<string>(key)?.trim() ?? '';
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}

export function readRewardsNotionDatabaseId(config: ConfigService): string {
  return readNotionEnv(config, 'NOTION_REWARDS_DB_ID');
}
