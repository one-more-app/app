import 'dotenv/config';
import 'reflect-metadata';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { OAuthAccountEntity } from '../auth/entities/oauth-account.entity.js';
import { SessionEntity } from '../auth/entities/session.entity.js';
import { UserEntity } from '../auth/entities/user.entity.js';
import { ExerciseCatalogEntity } from '../exercises/exercise-catalog.entity.js';
import { PerformanceEntryEntity } from '../performance/performance-entry.entity.js';
import { UserProfileEntity } from '../profile/user-profile.entity.js';
import { TrackedExerciseEntity } from '../tracked-exercises/tracked-exercise.entity.js';
import { UserProgressEntity } from '../progress/entities/user-progress.entity.js';
import { XpEventEntity } from '../progress/entities/xp-event.entity.js';
import { FriendshipEntity } from '../social/entities/friendship.entity.js';
import { ConversationEntity } from '../messaging/entities/conversation.entity.js';
import { MessageEntity } from '../messaging/entities/message.entity.js';
import { UserPresenceEntity } from '../presence/entities/user-presence.entity.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || databaseUrl.trim().length === 0) {
  throw new Error(
    'DATABASE_URL is missing. Define it in api/.env before running TypeORM CLI commands.',
  );
}

let parsedDatabaseUrl: URL;
try {
  parsedDatabaseUrl = new URL(databaseUrl);
} catch {
  throw new Error(
    'DATABASE_URL is invalid. Expected a valid Postgres URL like postgresql://user:password@host:port/db.',
  );
}

if (parsedDatabaseUrl.password.length === 0) {
  throw new Error(
    'DATABASE_URL must include a non-empty password (postgresql://user:password@host:port/db).',
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
    UserProgressEntity,
    XpEventEntity,
    FriendshipEntity,
    ConversationEntity,
    MessageEntity,
    UserPresenceEntity,
  ],
  migrations: [join(__dirname, 'migrations', '*.{js,ts}')],
  migrationsTransactionMode: 'each',
  synchronize: false,
  ssl:
    process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: false }
      : undefined,
});
