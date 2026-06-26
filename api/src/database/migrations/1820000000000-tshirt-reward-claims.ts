import type { MigrationInterface, QueryRunner } from 'typeorm';

export class TshirtRewardClaims1820000000000 implements MigrationInterface {
  name = 'TshirtRewardClaims1820000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "tshirt_reward_status_enum" AS ENUM ('pending', 'shipped', 'delivered')
    `);

    await queryRunner.query(`
      CREATE TABLE "tshirt_reward_claims" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "status" "tshirt_reward_status_enum" NOT NULL DEFAULT 'pending',
        "size" varchar(8) NOT NULL,
        "fullName" varchar(120) NOT NULL,
        "street" varchar(200) NOT NULL,
        "city" varchar(100) NOT NULL,
        "postalCode" varchar(20) NOT NULL,
        "country" varchar(80) NOT NULL,
        "trackingNumber" varchar(80),
        "claimedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "shippedAt" TIMESTAMPTZ,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tshirt_reward_claims" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tshirt_reward_claims_user" UNIQUE ("userId")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tshirt_reward_claims_status"
      ON "tshirt_reward_claims" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tshirt_reward_claims"`);
    await queryRunner.query(`DROP TYPE "tshirt_reward_status_enum"`);
  }
}
