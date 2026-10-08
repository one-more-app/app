import type { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationDeliveryAnalytics2160000000000 implements MigrationInterface {
  name = 'NotificationDeliveryAnalytics2160000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notification_deliveries"
      ADD COLUMN IF NOT EXISTS "analytics" jsonb NOT NULL DEFAULT '{}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notification_deliveries" DROP COLUMN IF EXISTS "analytics"
    `);
  }
}
