import { MigrationInterface, QueryRunner } from 'typeorm';

export class SessionRefreshSelector1990000000000 implements MigrationInterface {
  name = 'SessionRefreshSelector1990000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sessions"
      ADD COLUMN IF NOT EXISTS "selector" text
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_sessions_selector"
      ON "sessions" ("selector")
      WHERE "selector" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_sessions_selector"`);
    await queryRunner.query(`
      ALTER TABLE "sessions"
      DROP COLUMN IF EXISTS "selector"
    `);
  }
}
