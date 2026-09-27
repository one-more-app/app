import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UserAccountSoftDelete2000000000000 implements MigrationInterface {
  name = 'UserAccountSoftDelete2000000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "deletedAt" TIMESTAMP WITH TIME ZONE
    `);

    await queryRunner.query(`
      CREATE TABLE "account_deletion_feedback" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "comment" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_account_deletion_feedback" PRIMARY KEY ("id"),
        CONSTRAINT "FK_account_deletion_feedback_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_account_deletion_feedback_userId"
      ON "account_deletion_feedback" ("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_account_deletion_feedback_userId"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "account_deletion_feedback"
    `);
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "deletedAt"
    `);
  }
}
