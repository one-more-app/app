import type { MigrationInterface, QueryRunner } from 'typeorm';

export class OutboundMessaging2110000000000 implements MigrationInterface {
  name = 'OutboundMessaging2110000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "message_templates" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "key" text NOT NULL,
        "category" text NOT NULL,
        "channel" text NOT NULL,
        "content" jsonb NOT NULL,
        "variables" text[] NOT NULL DEFAULT '{}',
        "isActive" boolean NOT NULL DEFAULT true,
        "version" integer NOT NULL DEFAULT 1,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_message_templates" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_message_templates_key" UNIQUE ("key")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "outbound_dispatches" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "segmentKey" text NOT NULL,
        "segmentParams" jsonb NOT NULL DEFAULT '{}',
        "templateKey" text NOT NULL,
        "channel" text NOT NULL,
        "campaignKey" text,
        "idempotencyKey" text NOT NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "recipientCount" integer NOT NULL DEFAULT 0,
        "queuedCount" integer NOT NULL DEFAULT 0,
        "errorMessage" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_outbound_dispatches" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_outbound_dispatches_idempotencyKey" UNIQUE ("idempotencyKey")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "outbound_messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "dispatchId" uuid,
        "userId" uuid NOT NULL,
        "templateKey" text NOT NULL,
        "channel" text NOT NULL,
        "category" text NOT NULL,
        "dedupKey" text NOT NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "variables" jsonb NOT NULL DEFAULT '{}',
        "providerMessageId" text,
        "lastError" text,
        "sentAt" TIMESTAMPTZ,
        "openedAt" TIMESTAMPTZ,
        "clickedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_outbound_messages" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_outbound_messages_dedupKey" UNIQUE ("dedupKey"),
        CONSTRAINT "FK_outbound_messages_dispatch"
          FOREIGN KEY ("dispatchId") REFERENCES "outbound_dispatches"("id")
          ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_outbound_messages_status_createdAt"
      ON "outbound_messages" ("status", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_outbound_messages_userId"
      ON "outbound_messages" ("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_outbound_messages_userId"`);
    await queryRunner.query(
      `DROP INDEX "IDX_outbound_messages_status_createdAt"`,
    );
    await queryRunner.query(`DROP TABLE "outbound_messages"`);
    await queryRunner.query(`DROP TABLE "outbound_dispatches"`);
    await queryRunner.query(`DROP TABLE "message_templates"`);
  }
}
