import { MigrationInterface, QueryRunner } from 'typeorm';

export class SocialAndAccess1780000000000 implements MigrationInterface {
  name = 'SocialAndAccess1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "access_tier_enum" AS ENUM ('limited', 'full');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "friendship_status_enum" AS ENUM ('pending', 'accepted', 'declined', 'blocked');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ADD COLUMN IF NOT EXISTS "inviteCode" text,
      ADD COLUMN IF NOT EXISTS "avatarUrl" text,
      ADD COLUMN IF NOT EXISTS "accessTier" "access_tier_enum" NOT NULL DEFAULT 'limited'
    `);

    await queryRunner.query(`
      UPDATE "user_profiles"
      SET "accessTier" = 'full'
      WHERE "accessTier" = 'limited'
    `);

    await queryRunner.query(`
      UPDATE "user_profiles"
      SET "inviteCode" = substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
      WHERE "inviteCode" IS NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_profiles_inviteCode"
      ON "user_profiles" ("inviteCode")
      WHERE "inviteCode" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "friendships" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "requesterId" uuid NOT NULL,
        "addresseeId" uuid NOT NULL,
        "status" "friendship_status_enum" NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_friendships" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_friendships_requester_addressee" UNIQUE ("requesterId", "addresseeId"),
        CONSTRAINT "CHK_friendships_not_self" CHECK ("requesterId" <> "addresseeId"),
        CONSTRAINT "FK_friendships_requester" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_friendships_addressee" FOREIGN KEY ("addresseeId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_friendships_requester"
      ON "friendships" ("requesterId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_friendships_addressee"
      ON "friendships" ("addresseeId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "friendships"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_user_profiles_inviteCode"`,
    );
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      DROP COLUMN IF EXISTS "accessTier",
      DROP COLUMN IF EXISTS "avatarUrl",
      DROP COLUMN IF EXISTS "inviteCode"
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "friendship_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "access_tier_enum"`);
  }
}
