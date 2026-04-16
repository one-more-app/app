import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { OAuthAccountEntity } from '../auth/entities/oauth-account.entity.js';
import { SessionEntity } from '../auth/entities/session.entity.js';
import { UserEntity } from '../auth/entities/user.entity.js';
import { ExerciseCatalogEntity } from '../exercises/exercise-catalog.entity.js';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { TrackedExerciseEntity } from '../tracked-exercises/tracked-exercise.entity.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is missing. Define it in api/.env before running TypeORM CLI commands.',
  );
}

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [
    UserEntity,
    UserProfileEntity,
    OAuthAccountEntity,
    SessionEntity,
    TrackedExerciseEntity,
    PerformanceEntryEntity,
    ExerciseCatalogEntity,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  ssl:
    process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: false }
      : undefined,
});
