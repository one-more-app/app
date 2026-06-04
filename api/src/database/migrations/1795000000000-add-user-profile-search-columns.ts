import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Rattrapage si user_profiles n'a pas les colonnes sociales (username, visibilité).
 * Idempotent : safe si 1790000000000 a déjà tourné ou après une réparation catalogue partielle.
 */
export class AddUserProfileSearchColumns1795000000000
  implements MigrationInterface
{
  name = 'AddUserProfileSearchColumns1795000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ADD COLUMN IF NOT EXISTS "username" text,
      ADD COLUMN IF NOT EXISTS "searchableByName" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "discoverableByUsername" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      UPDATE "user_profiles"
      SET "searchableByName" = true,
          "discoverableByUsername" = true
      WHERE "searchableByName" IS DISTINCT FROM true
         OR "discoverableByUsername" IS DISTINCT FROM true
    `);

    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ALTER COLUMN "searchableByName" SET DEFAULT true
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_profiles_username"
      ON "user_profiles" (lower("username"))
      WHERE "username" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_user_profiles_username"`,
    );
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      DROP COLUMN IF EXISTS "discoverableByUsername",
      DROP COLUMN IF EXISTS "searchableByName",
      DROP COLUMN IF EXISTS "username"
    `);
  }
}
