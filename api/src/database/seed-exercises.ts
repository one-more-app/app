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

async function run() {
  const filePath = join(
    process.cwd(),
    '..',
    'client',
    'src',
    'data',
    'popular-exercises.json',
  );
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
