import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  OAuthAccountEntity,
  OAuthProvider,
} from '../auth/entities/oauth-account.entity.js';
import { SessionEntity } from '../auth/entities/session.entity.js';
import { UserEntity } from '../auth/entities/user.entity.js';
import { ExerciseCatalogEntity } from '../exercises/exercise-catalog.entity.js';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { TrackedExerciseEntity } from '../tracked-exercises/tracked-exercise.entity.js';
import { UserProgressEntity } from '../progress/entities/user-progress.entity.js';
import { XpEventEntity } from '../progress/entities/xp-event.entity.js';

export const TYPEORM_ENTITIES = [
  UserEntity,
  UserProfileEntity,
  OAuthAccountEntity,
  SessionEntity,
  TrackedExerciseEntity,
  PerformanceEntryEntity,
  ExerciseCatalogEntity,
  UserProgressEntity,
  XpEventEntity,
] as const;

const getDatabaseUrl = (config: ConfigService): string => {
  const rawUrl = config.get<string>('DATABASE_URL');

  if (!rawUrl || rawUrl.trim().length === 0) {
    throw new Error(
      'DATABASE_URL is missing. Define it in api/.env (see api/.env.example).',
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error(
      'DATABASE_URL is invalid. Expected a valid Postgres URL like postgresql://user:password@host:port/db.',
    );
  }

  // pg with SCRAM requires password to be a string; absent password leads to a cryptic runtime error.
  if (parsedUrl.password.length === 0) {
    throw new Error(
      'DATABASE_URL must include a non-empty password (postgresql://user:password@host:port/db).',
    );
  }

  return rawUrl;
};

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: getDatabaseUrl(config),
        entities: [...TYPEORM_ENTITIES],
        migrations: ['dist/database/migrations/*.js'],
        synchronize: false,
        logging: false,
        ssl:
          config.get<string>('DATABASE_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : undefined,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class TypeormDatabaseModule {}

export { OAuthProvider };
