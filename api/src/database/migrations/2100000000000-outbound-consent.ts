import type { MigrationInterface, QueryRunner } from 'typeorm';

export class OutboundConsent2100000000000 implements MigrationInterface {
  name = 'OutboundConsent2100000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notification_preferences"
      ADD COLUMN "marketingEmail" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "unsubscribeToken" uuid
    `);
    await queryRunner.query(`
      UPDATE "users"
      SET "unsubscribeToken" = gen_random_uuid()
      WHERE "unsubscribeToken" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "unsubscribeToken" SET NOT NULL,
      ALTER COLUMN "unsubscribeToken" SET DEFAULT gen_random_uuid()
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "UQ_users_unsubscribeToken" UNIQUE ("unsubscribeToken")
    `);

    await queryRunner.query(`
      CREATE TABLE "email_suppressions" (
        "email" text NOT NULL,
        "reason" text NOT NULL,
        "meta" jsonb,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_suppressions" PRIMARY KEY ("email")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "email_suppressions"`);
    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT "UQ_users_unsubscribeToken"
    `);
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "unsubscribeToken"
    `);
    await queryRunner.query(`
      ALTER TABLE "notification_preferences" DROP COLUMN "marketingEmail"
    `);
  }
}
