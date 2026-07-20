import type { MigrationInterface, QueryRunner } from 'typeorm';

export class EventEntryDeletedAt1930000000000 implements MigrationInterface {
  name = 'EventEntryDeletedAt1930000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_entries"
      ADD COLUMN "deletedAt" TIMESTAMP WITH TIME ZONE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "event_entries" DROP COLUMN "deletedAt"
    `);
  }
}
