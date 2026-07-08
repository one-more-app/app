import type { MigrationInterface, QueryRunner } from 'typeorm';

export class TshirtRewardsMultiType1830000000000 implements MigrationInterface {
  name = 'TshirtRewardsMultiType1830000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "tshirt_reward_status_enum"
      ADD VALUE IF NOT EXISTS 'claim_pending'
    `);

    await queryRunner.query(`
      CREATE TYPE "tshirt_reward_type_enum" AS ENUM ('referral_limited', 'annual_classic_pack')
    `);

    await queryRunner.query(`
      ALTER TABLE "tshirt_reward_claims"
      ADD COLUMN "rewardType" "tshirt_reward_type_enum" NOT NULL DEFAULT 'referral_limited'
    `);

    await queryRunner.query(`
      ALTER TABLE "tshirt_reward_claims"
      DROP CONSTRAINT "UQ_tshirt_reward_claims_user"
    `);

    await queryRunner.query(`
      ALTER TABLE "tshirt_reward_claims"
      ADD CONSTRAINT "UQ_tshirt_reward_claims_user_reward_type"
      UNIQUE ("userId", "rewardType")
    `);

    await queryRunner.query(`
      ALTER TABLE "tshirt_reward_claims"
      ALTER COLUMN "size" DROP NOT NULL,
      ALTER COLUMN "fullName" DROP NOT NULL,
      ALTER COLUMN "street" DROP NOT NULL,
      ALTER COLUMN "city" DROP NOT NULL,
      ALTER COLUMN "postalCode" DROP NOT NULL,
      ALTER COLUMN "country" DROP NOT NULL,
      ALTER COLUMN "claimedAt" DROP NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "tshirt_reward_claims"
      ADD COLUMN "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tshirt_reward_claims"
      DROP COLUMN "createdAt"
    `);

    await queryRunner.query(`
      ALTER TABLE "tshirt_reward_claims"
      ALTER COLUMN "claimedAt" SET NOT NULL,
      ALTER COLUMN "country" SET NOT NULL,
      ALTER COLUMN "postalCode" SET NOT NULL,
      ALTER COLUMN "city" SET NOT NULL,
      ALTER COLUMN "street" SET NOT NULL,
      ALTER COLUMN "fullName" SET NOT NULL,
      ALTER COLUMN "size" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "tshirt_reward_claims"
      DROP CONSTRAINT "UQ_tshirt_reward_claims_user_reward_type"
    `);

    await queryRunner.query(`
      ALTER TABLE "tshirt_reward_claims"
      ADD CONSTRAINT "UQ_tshirt_reward_claims_user"
      UNIQUE ("userId")
    `);

    await queryRunner.query(`
      ALTER TABLE "tshirt_reward_claims"
      DROP COLUMN "rewardType"
    `);

    await queryRunner.query(`
      DROP TYPE "tshirt_reward_type_enum"
    `);
  }
}
