import { MigrationInterface, QueryRunner } from 'typeorm';

export class SocialSearchMessagingPresence1790000000000 implements MigrationInterface {
  name = 'SocialSearchMessagingPresence1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ADD COLUMN IF NOT EXISTS "username" text,
      ADD COLUMN IF NOT EXISTS "searchableByName" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "discoverableByUsername" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_profiles_username"
      ON "user_profiles" (lower("username"))
      WHERE "username" IS NOT NULL
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "presence_status_enum" AS ENUM ('offline', 'online', 'training');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "conversations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "participantLowId" uuid NOT NULL,
        "participantHighId" uuid NOT NULL,
        "lastMessageAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_conversations_participants" UNIQUE ("participantLowId", "participantHighId"),
        CONSTRAINT "CHK_conversations_ordered" CHECK ("participantLowId" < "participantHighId"),
        CONSTRAINT "FK_conversations_low" FOREIGN KEY ("participantLowId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_conversations_high" FOREIGN KEY ("participantHighId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversations_lastMessageAt"
      ON "conversations" ("lastMessageAt" DESC NULLS LAST)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "conversationId" uuid NOT NULL,
        "senderId" uuid NOT NULL,
        "body" text NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "readAt" TIMESTAMPTZ,
        CONSTRAINT "PK_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_messages_conversation" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_messages_sender" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_messages_conversation_created"
      ON "messages" ("conversationId", "createdAt" DESC)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_presence" (
        "userId" uuid NOT NULL,
        "status" "presence_status_enum" NOT NULL DEFAULT 'offline',
        "exerciseName" text,
        "trackedExerciseId" uuid,
        "lastHeartbeatAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_presence" PRIMARY KEY ("userId"),
        CONSTRAINT "FK_user_presence_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_presence"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "conversations"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "presence_status_enum"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_user_profiles_username"`,
    );
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      DROP COLUMN IF EXISTS "discoverableByUsername",
      DROP COLUMN IF EXISTS "searchableByName",
      DROP COLUMN IF EXISTS "username"
    `);
  }
}
