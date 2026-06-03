import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type CatalogVariant = 'filtered' | 'all';

export function resolveDataDir(): string {
  return join(process.cwd(), 'data');
}

export function resolveVariantCatalogPath(variant: CatalogVariant): string {
  const file =
    variant === 'filtered'
      ? 'popular-exercises.filtered.json'
      : 'popular-exercises.all.json';
  return join(resolveDataDir(), file);
}

export function parseCatalogVariant(
  raw: string | undefined,
): CatalogVariant | null {
  if (raw === 'filtered' || raw === 'all') return raw;
  return null;
}

export function resolveSeedJsonPath(): string {
  const fromEnv = process.env.EXERCISES_CATALOG_SEED_PATH;
  if (fromEnv) return fromEnv;

  const variant = parseCatalogVariant(process.env.EXERCISES_CATALOG_VARIANT);
  if (variant) return resolveVariantCatalogPath(variant);

  const activePath = join(resolveDataDir(), 'popular-exercises.json');
  if (existsSync(activePath)) return activePath;

  throw new Error(
    'Catalogue exercices introuvable. Utiliser EXERCISES_CATALOG_VARIANT=all|filtered, EXERCISES_CATALOG_SEED_PATH, ou npm run catalog:use-all|use-filtered.',
  );
}
