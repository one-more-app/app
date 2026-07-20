import type { MigrationInterface, QueryRunner } from 'typeorm';

export class EventEntryCelebrationPending1900000000000 implements MigrationInterface {
  name = 'EventEntryCelebrationPending1900000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_entries"
      ADD COLUMN "celebrationPending" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_entries" DROP COLUMN "celebrationPending"
    `);
  }
}
