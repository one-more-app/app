import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import dataSource from './data-source.js';
import { UserEntity } from '../auth/entities/user.entity.js';
import { TrackedExerciseEntity } from '../tracked-exercises/tracked-exercise.entity.js';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';

type ImportTrackedExercise = {
  id: string;
  exerciseId: string;
  name: string;
  originalName?: string | null;
  bodyPart?: string | null;
  target?: string | null;
  equipment?: string | null;
  category?: string | null;
  gifUrl?: string | null;
  isCustom?: boolean;
  deletedAt?: string | null;
};

type ImportPerformanceEntry = {
  id: string;
  trackedExerciseId: string;
  date: string;
  weight: number;
  reps: number;
  deletedAt?: string | null;
};

function getArgValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return undefined;
  return process.argv[idx + 1];
}

function decodeBase64Utf8(input: string): string {
  return Buffer.from(input, 'base64').toString('utf8');
}

function parseJsonArray<T>(raw: string, label: string): T[] {
  const value = JSON.parse(raw) as unknown;
  if (!Array.isArray(value)) {
    throw new Error(`${label} doit être un tableau JSON.`);
  }
  return value as T[];
}

function parseDeletedAt(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  return date;
}

function resolveDataPath(envKey: string, defaultFileName: string): string {
  const fromEnv = process.env[envKey];
  if (fromEnv) return fromEnv;

  const defaultPath = join(process.cwd(), 'data', defaultFileName);
  if (existsSync(defaultPath)) return defaultPath;

  throw new Error(
    `Fichier introuvable: ${defaultFileName}. Définir ${envKey} ou placer le fichier dans api/data/.`,
  );
}

async function run() {
  const userIdArg = getArgValue('--user-id');
  const emailArg = getArgValue('--email');
  if (!userIdArg && !emailArg) {
    throw new Error('Fournir --user-id <uuid> ou --email <email>.');
  }

  const trackJsonArg = getArgValue('--track-json');
  const perfJsonArg = getArgValue('--perf-json');
  const trackJsonBase64Arg = getArgValue('--track-json-base64');
  const perfJsonBase64Arg = getArgValue('--perf-json-base64');

  const trackRaw = trackJsonArg
    ? trackJsonArg
    : trackJsonBase64Arg
      ? decodeBase64Utf8(trackJsonBase64Arg)
      : await readFile(
          resolveDataPath('IMPORT_USER_TRACK_PATH', 'import-user-track.json'),
          'utf8',
        );
  const perfRaw = perfJsonArg
    ? perfJsonArg
    : perfJsonBase64Arg
      ? decodeBase64Utf8(perfJsonBase64Arg)
      : await readFile(
          resolveDataPath('IMPORT_USER_PERF_PATH', 'import-user-perf.json'),
          'utf8',
        );

  const trackedRows = parseJsonArray<ImportTrackedExercise>(
    trackRaw,
    'Les données track',
  );
  const perfRows = parseJsonArray<ImportPerformanceEntry>(
    perfRaw,
    'Les données perf',
  );

  await dataSource.initialize();

  const userRepo = dataSource.getRepository(UserEntity);
  const trackedRepo = dataSource.getRepository(TrackedExerciseEntity);
  const perfRepo = dataSource.getRepository(PerformanceEntryEntity);

  const user = userIdArg
    ? await userRepo.findOne({ where: { id: userIdArg } })
    : await userRepo.findOne({ where: { email: emailArg! } });
  if (!user) {
    throw new Error('Utilisateur introuvable avec les critères fournis.');
  }

  let importedTracked = 0;
  for (const row of trackedRows) {
    await trackedRepo.upsert(
      {
        userId: user.id,
        clientId: row.id,
        exerciseId: row.exerciseId,
        name: row.name,
        originalName: row.originalName ?? null,
        bodyPart: row.bodyPart ?? null,
        target: row.target ?? null,
        equipment: row.equipment ?? null,
        category: row.category ?? null,
        gifUrl: row.gifUrl ?? null,
        isCustom: row.isCustom ?? row.exerciseId.startsWith('custom-'),
        deletedAt: parseDeletedAt(row.deletedAt),
      },
      ['userId', 'clientId'],
    );
    importedTracked += 1;
  }

  const trackedMap = new Map<string, string>();
  const trackedEntities = await trackedRepo.find({
    where: { userId: user.id },
    select: ['id', 'clientId'],
  });
  for (const row of trackedEntities) trackedMap.set(row.clientId, row.id);

  let importedPerf = 0;
  let skippedPerf = 0;
  for (const row of perfRows) {
    const trackedExerciseDbId = trackedMap.get(row.trackedExerciseId);
    if (!trackedExerciseDbId) {
      skippedPerf += 1;
      continue;
    }
    await perfRepo.upsert(
      {
        userId: user.id,
        clientId: row.id,
        trackedExerciseId: trackedExerciseDbId,
        date: row.date,
        weight: row.weight,
        reps: Math.round(row.reps),
        deletedAt: parseDeletedAt(row.deletedAt),
      },
      ['userId', 'clientId'],
    );
    importedPerf += 1;
  }

  await dataSource.destroy();

  // eslint-disable-next-line no-console
  console.log(
    `Import terminé pour user=${user.id} (${user.email ?? 'email-null'}) | tracked=${importedTracked} | perf=${importedPerf} | perf_skipped=${skippedPerf}`,
  );
}

void run();
