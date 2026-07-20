import type { MigrationInterface, QueryRunner } from 'typeorm';

export class EventEntryResultDisplayPending1920000000000 implements MigrationInterface {
  name = 'EventEntryResultDisplayPending1920000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_entries"
      ADD COLUMN "resultDisplayPending" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_entries" DROP COLUMN "resultDisplayPending"
    `);
  }
}
