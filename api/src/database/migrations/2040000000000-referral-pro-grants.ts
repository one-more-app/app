import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ReferralProGrants2040000000000 implements MigrationInterface {
  name = 'ReferralProGrants2040000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "referral_pro_grants" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "status" varchar(32) NOT NULL,
        "grantedAt" TIMESTAMPTZ,
        "errorMessage" text,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_referral_pro_grants" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_referral_pro_grants_user" UNIQUE ("userId"),
        CONSTRAINT "FK_referral_pro_grants_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "referral_pro_grants"`);
  }
}
