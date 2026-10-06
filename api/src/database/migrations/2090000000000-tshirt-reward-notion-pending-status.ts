import type { MigrationInterface, QueryRunner } from 'typeorm';

export class TshirtRewardNotionPendingStatus2090000000000 implements MigrationInterface {
  name = 'TshirtRewardNotionPendingStatus2090000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tshirt_reward_claims"
      ADD COLUMN "notionPendingStatus" "tshirt_reward_status_enum",
      ADD COLUMN "notionPendingSince" TIMESTAMPTZ
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_tshirt_reward_claims_notion_pending"
      ON "tshirt_reward_claims" ("notionPendingSince")
      WHERE "notionPendingStatus" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_tshirt_reward_claims_notion_pending"
    `);
    await queryRunner.query(`
      ALTER TABLE "tshirt_reward_claims"
      DROP COLUMN "notionPendingSince",
      DROP COLUMN "notionPendingStatus"
    `);
  }
}
