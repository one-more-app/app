import { MigrationInterface, QueryRunner } from 'typeorm';

export class SearchVisibilityDefaults1792000000000 implements MigrationInterface {
  name = 'SearchVisibilityDefaults1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "user_profiles"
      SET "searchableByName" = true,
          "discoverableByUsername" = true
    `);

    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ALTER COLUMN "searchableByName" SET DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ALTER COLUMN "searchableByName" SET DEFAULT false
    `);
  }
}
