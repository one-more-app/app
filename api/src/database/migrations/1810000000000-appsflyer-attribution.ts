import { MigrationInterface, QueryRunner } from 'typeorm';

export class AppsFlyerAttribution1810000000000 implements MigrationInterface {
  name = 'AppsFlyerAttribution1810000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ADD COLUMN IF NOT EXISTS "afMediaSource" text,
      ADD COLUMN IF NOT EXISTS "afCampaign" text,
      ADD COLUMN IF NOT EXISTS "afAdset" text,
      ADD COLUMN IF NOT EXISTS "afAdgroup" text,
      ADD COLUMN IF NOT EXISTS "afKeywords" text,
      ADD COLUMN IF NOT EXISTS "afIsRetargeting" boolean,
      ADD COLUMN IF NOT EXISTS "afSub1" text,
      ADD COLUMN IF NOT EXISTS "afDeepLinkValue" text,
      ADD COLUMN IF NOT EXISTS "attributionRecordedAt" timestamptz
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_profiles_attribution_recorded"
      ON "user_profiles" ("attributionRecordedAt")
      WHERE "attributionRecordedAt" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_user_profiles_attribution_recorded"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      DROP COLUMN IF EXISTS "afMediaSource",
      DROP COLUMN IF EXISTS "afCampaign",
      DROP COLUMN IF EXISTS "afAdset",
      DROP COLUMN IF EXISTS "afAdgroup",
      DROP COLUMN IF EXISTS "afKeywords",
      DROP COLUMN IF EXISTS "afIsRetargeting",
      DROP COLUMN IF EXISTS "afSub1",
      DROP COLUMN IF EXISTS "afDeepLinkValue",
      DROP COLUMN IF EXISTS "attributionRecordedAt"
    `);
  }
}

