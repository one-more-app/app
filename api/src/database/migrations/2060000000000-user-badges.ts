import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UserBadges2060000000000 implements MigrationInterface {
  name = 'UserBadges2060000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_badges" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "kind" varchar(64) NOT NULL,
        "tier" varchar(64) NOT NULL,
        "sourceKey" varchar(128) NOT NULL,
        "earnedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "meta" jsonb NOT NULL DEFAULT '{}',
        "deeplink" varchar(512),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_badges" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_badges_user_kind_source" UNIQUE ("userId", "kind", "sourceKey"),
        CONSTRAINT "FK_user_badges_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_badges_userId_earnedAt"
      ON "user_badges" ("userId", "earnedAt" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_badges_userId_earnedAt"`);
    await queryRunner.query(`DROP TABLE "user_badges"`);
  }
}
