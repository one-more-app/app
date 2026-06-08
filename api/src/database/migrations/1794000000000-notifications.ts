import { MigrationInterface, QueryRunner } from 'typeorm';

export class Notifications1794000000000 implements MigrationInterface {
  name = 'Notifications1794000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "device_platform_enum" AS ENUM ('ios', 'android');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "device_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "token" text NOT NULL,
        "platform" "device_platform_enum" NOT NULL,
        "timezone" text NOT NULL DEFAULT 'UTC',
        "lastSeenAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_device_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_device_tokens_token" UNIQUE ("token"),
        CONSTRAINT "FK_device_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_device_tokens_userId"
      ON "device_tokens" ("userId")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_preferences" (
        "userId" uuid NOT NULL,
        "streakReminders" boolean NOT NULL DEFAULT true,
        "friendRequests" boolean NOT NULL DEFAULT true,
        "friendAccepted" boolean NOT NULL DEFAULT true,
        "messages" boolean NOT NULL DEFAULT true,
        "friendTraining" boolean NOT NULL DEFAULT true,
        "friendRecords" boolean NOT NULL DEFAULT true,
        "weeklyRecap" boolean NOT NULL DEFAULT true,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_preferences" PRIMARY KEY ("userId"),
        CONSTRAINT "FK_notification_preferences_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_deliveries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "type" text NOT NULL,
        "dedupKey" text NOT NULL,
        "sentAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_deliveries" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_notification_deliveries_dedup" UNIQUE ("userId", "type", "dedupKey"),
        CONSTRAINT "FK_notification_deliveries_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "friend_training_alerts" (
        "subscriberId" uuid NOT NULL,
        "friendId" uuid NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_friend_training_alerts" PRIMARY KEY ("subscriberId", "friendId"),
        CONSTRAINT "FK_friend_training_alerts_subscriber" FOREIGN KEY ("subscriberId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_friend_training_alerts_friend" FOREIGN KEY ("friendId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_friend_training_alerts_not_self" CHECK ("subscriberId" <> "friendId")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "friend_training_alerts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_deliveries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_preferences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "device_tokens"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "device_platform_enum"`);
  }
}
