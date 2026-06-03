import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  type CatalogVariant,
  resolveDataDir,
  resolveVariantCatalogPath,
} from './exercise-catalog-path.js';

function run(): void {
  const variant = process.argv[2] as CatalogVariant | undefined;
  if (variant !== 'filtered' && variant !== 'all') {
    console.error('Usage: switch-exercises-catalog <filtered|all>');
    process.exit(1);
  }

  const source = resolveVariantCatalogPath(variant);
  const activePath = join(resolveDataDir(), 'popular-exercises.json');

  if (!existsSync(source)) {
    console.error(`Fichier introuvable: ${source}`);
    if (variant === 'all') {
      console.error('Exécute d’abord: npm run fetch:all-exercises');
    }
    process.exit(1);
  }

  copyFileSync(source, activePath);
  // eslint-disable-next-line no-console
  console.log(`Catalogue actif → ${variant}`);
  // eslint-disable-next-line no-console
  console.log(`  ${source}`);
  // eslint-disable-next-line no-console
  console.log(`  → ${activePath}`);
  // eslint-disable-next-line no-console
  console.log('\nRecharge la base:');
  // eslint-disable-next-line no-console
  console.log('  npm run seed:exercises:replace        # dev (ts-node)');
  // eslint-disable-next-line no-console
  console.log('  npm run seed:exercises:replace:prod   # prod (dist compilé)');
}

run();
