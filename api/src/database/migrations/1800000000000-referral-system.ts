import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReferralSystem1800000000000 implements MigrationInterface {
  name = 'ReferralSystem1800000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ADD COLUMN IF NOT EXISTS "referredByUserId" uuid
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "user_profiles"
        ADD CONSTRAINT "FK_user_profiles_referred_by"
        FOREIGN KEY ("referredByUserId") REFERENCES "users"("id") ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_profiles_referred_by"
      ON "user_profiles" ("referredByUserId")
      WHERE "referredByUserId" IS NOT NULL
    `);

    // Rétroactif : les amitiés acceptées existantes comptent comme parrainages.
    await queryRunner.query(`
      UPDATE "user_profiles" up
      SET "referredByUserId" = f."requesterId"
      FROM "friendships" f
      WHERE f."addresseeId" = up."userId"
        AND f."status" = 'accepted'
        AND up."referredByUserId" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      DROP COLUMN IF EXISTS "accessTier"
    `);

    await queryRunner.query(`DROP TYPE IF EXISTS "access_tier_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "access_tier_enum" AS ENUM ('limited', 'full');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ADD COLUMN IF NOT EXISTS "accessTier" "access_tier_enum" NOT NULL DEFAULT 'limited'
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_user_profiles_referred_by"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      DROP CONSTRAINT IF EXISTS "FK_user_profiles_referred_by"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      DROP COLUMN IF EXISTS "referredByUserId"
    `);
  }
}
