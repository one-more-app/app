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
  const candidates = [
    join(process.cwd(), 'data', 'popular-exercises.json'),
    join(process.cwd(), '..', 'client', 'src', 'data', 'popular-exercises.json'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    'Fichier popular-exercises.json introuvable. Définir EXERCISES_CATALOG_SEED_PATH ou exécuter npm run sync:exercises-catalog depuis api/.',
  );
}

async function run() {
  const filePath = resolveSeedJsonPath();
  const raw = await readFile(filePath, 'utf8');
  const exercises = JSON.parse(raw) as SeedExercise[];

  await dataSource.initialize();
  const repo = dataSource.getRepository(ExerciseCatalogEntity);

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
