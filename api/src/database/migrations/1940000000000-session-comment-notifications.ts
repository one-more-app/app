import { MigrationInterface, QueryRunner } from 'typeorm';

export class SessionCommentNotifications1940000000000 implements MigrationInterface {
  name = 'SessionCommentNotifications1940000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notification_preferences"
      ADD COLUMN IF NOT EXISTS "sessionComments" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notification_preferences"
      DROP COLUMN IF EXISTS "sessionComments"
    `);
  }
}
