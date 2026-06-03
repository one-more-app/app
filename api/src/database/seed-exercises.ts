import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import dataSource from './data-source.js';
import { ExerciseCatalogEntity } from '../exercises/exercise-catalog.entity.js';

type SeedExercise = {
  id: string;
  name: string;
  nameFr?: string;
  bodyPart: string;
  target: string;
  equipment: string;
  secondaryMuscles?: string[];
  instructions?: string[];
  gifUrl?: string;
};

function resolveSeedJsonPath(): string {
  const fromEnv = process.env.EXERCISES_CATALOG_SEED_PATH;
  if (fromEnv) return fromEnv;
  const activePath = join(process.cwd(), 'data', 'popular-exercises.json');
  if (existsSync(activePath)) return activePath;
  throw new Error(
    'api/data/popular-exercises.json introuvable. Exécuter npm run catalog:use-all ou catalog:use-filtered depuis api/.',
  );
}

function shouldReplaceCatalog(): boolean {
  const raw = process.env.EXERCISES_CATALOG_REPLACE;
  return raw === '1' || raw === 'true';
}

async function run() {
  const filePath = resolveSeedJsonPath();
  const raw = await readFile(filePath, 'utf8');
  const exercises = JSON.parse(raw) as SeedExercise[];

  await dataSource.initialize();
  const repo = dataSource.getRepository(ExerciseCatalogEntity);

  if (shouldReplaceCatalog()) {
    const ids = exercises.map((ex) => ex.id);
    if (ids.length > 0) {
      await repo
        .createQueryBuilder()
        .delete()
        .where('exerciseId NOT IN (:...ids)', { ids })
        .execute();
    } else {
      await repo.clear();
    }
  }

  for (const ex of exercises) {
    await repo.upsert(
      {
        exerciseId: ex.id,
        name: ex.name,
        nameFr: ex.nameFr ?? null,
        bodyPart: ex.bodyPart,
        target: ex.target,
        equipment: ex.equipment,
        secondaryMuscles: ex.secondaryMuscles ?? [],
        instructions: ex.instructions ?? [],
        gifUrl: ex.gifUrl ?? null,
      },
      ['exerciseId'],
    );
  }

  await dataSource.destroy();
  // eslint-disable-next-line no-console
  console.log(`Seeded exercise catalog (${exercises.length} rows)`);
}

void run();
