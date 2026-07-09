import type { MigrationInterface, QueryRunner } from 'typeorm';

export class TshirtRewardGender1850000000000 implements MigrationInterface {
  name = 'TshirtRewardGender1850000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tshirt_reward_claims"
      ADD COLUMN "gender" varchar(16)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tshirt_reward_claims"
      DROP COLUMN "gender"
    `);
  }
}
