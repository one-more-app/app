import type { MigrationInterface, QueryRunner } from 'typeorm';

export class PremiumReferral1810000000000 implements MigrationInterface {
  name = 'PremiumReferral1810000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "isPremium" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "isPremium"
    `);
  }
}
