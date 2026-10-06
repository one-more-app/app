import type { MigrationInterface, QueryRunner } from 'typeorm';

export class TshirtRewardNotionPageId2080000000000 implements MigrationInterface {
  name = 'TshirtRewardNotionPageId2080000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tshirt_reward_claims"
      ADD COLUMN "notionPageId" varchar(36)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_tshirt_reward_claims_notionPageId"
      ON "tshirt_reward_claims" ("notionPageId")
      WHERE "notionPageId" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_tshirt_reward_claims_notionPageId"
    `);
    await queryRunner.query(`
      ALTER TABLE "tshirt_reward_claims"
      DROP COLUMN "notionPageId"
    `);
  }
}
