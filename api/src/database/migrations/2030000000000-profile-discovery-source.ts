import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProfileDiscoverySource2030000000000 implements MigrationInterface {
  name = 'ProfileDiscoverySource2030000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ADD COLUMN IF NOT EXISTS "discoverySource" text,
      ADD COLUMN IF NOT EXISTS "discoverySourceDetail" text,
      ADD COLUMN IF NOT EXISTS "discoverySourceRecordedAt" timestamptz
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_profiles_discovery_source_recorded"
      ON "user_profiles" ("discoverySourceRecordedAt")
      WHERE "discoverySourceRecordedAt" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_user_profiles_discovery_source_recorded"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      DROP COLUMN IF EXISTS "discoverySource",
      DROP COLUMN IF EXISTS "discoverySourceDetail",
      DROP COLUMN IF EXISTS "discoverySourceRecordedAt"
    `);
  }
}
