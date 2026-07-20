import type { MigrationInterface, QueryRunner } from 'typeorm';

export class EventEntryLastName1890000000000 implements MigrationInterface {
  name = 'EventEntryLastName1890000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_entries"
      ADD COLUMN "lastName" varchar(80) NOT NULL DEFAULT ''
    `);
    await queryRunner.query(`
      ALTER TABLE "event_entries"
      ALTER COLUMN "lastName" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_entries" DROP COLUMN "lastName"
    `);
  }
}
