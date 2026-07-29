import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationFeed1980000000000 implements MigrationInterface {
  name = 'NotificationFeed1980000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notification_deliveries"
      ADD COLUMN IF NOT EXISTS "title" text,
      ADD COLUMN IF NOT EXISTS "body" text,
      ADD COLUMN IF NOT EXISTS "route" text,
      ADD COLUMN IF NOT EXISTS "readAt" timestamptz
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_deliveries_userId_sentAt"
      ON "notification_deliveries" ("userId", "sentAt" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_deliveries_userId_readAt"
      ON "notification_deliveries" ("userId", "readAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notification_deliveries_userId_readAt"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notification_deliveries_userId_sentAt"`,
    );
    await queryRunner.query(`
      ALTER TABLE "notification_deliveries"
      DROP COLUMN IF EXISTS "readAt",
      DROP COLUMN IF EXISTS "route",
      DROP COLUMN IF EXISTS "body",
      DROP COLUMN IF EXISTS "title"
    `);
  }
}
