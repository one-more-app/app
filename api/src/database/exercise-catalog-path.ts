import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function resolveDataDir(): string {
  return join(process.cwd(), 'data');
}

export function resolveSeedJsonPath(): string {
  const fromEnv = process.env.EXERCISES_CATALOG_SEED_PATH;
  if (fromEnv) return fromEnv;

  const catalogPath = join(resolveDataDir(), 'popular-exercises.json');
  if (existsSync(catalogPath)) return catalogPath;

  throw new Error(
    'Catalogue exercices introuvable. Attendu : api/data/popular-exercises.json',
  );
}
