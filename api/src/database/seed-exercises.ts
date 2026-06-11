import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import dataSource from './data-source.js';
import { resolveSeedJsonPath } from './exercise-catalog-path.js';
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
  const filePath = resolveSeedJsonPath();
  const raw = await readFile(filePath, 'utf8');
  const exercises = JSON.parse(raw) as SeedExercise[];

  await dataSource.initialize();
  const repo = dataSource.getRepository(ExerciseCatalogEntity);

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
  console.log(`Seeded exercise catalog (${exercises.length} rows from ${filePath})`);
}

void run();
