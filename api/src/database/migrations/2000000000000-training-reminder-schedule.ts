import { MigrationInterface, QueryRunner } from 'typeorm';

export class TrainingReminderSchedule2000000000000 implements MigrationInterface {
  name = 'TrainingReminderSchedule2000000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notification_preferences"
      ADD COLUMN IF NOT EXISTS "reminderWeekdays" smallint[] NOT NULL DEFAULT '{}'
    `);
    await queryRunner.query(`
      ALTER TABLE "notification_preferences"
      ADD COLUMN IF NOT EXISTS "reminderHour" smallint NOT NULL DEFAULT 18
    `);
    await queryRunner.query(`
      ALTER TABLE "notification_preferences"
      ADD COLUMN IF NOT EXISTS "reminderMinute" smallint NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notification_preferences"
      DROP COLUMN IF EXISTS "reminderMinute"
    `);
    await queryRunner.query(`
      ALTER TABLE "notification_preferences"
      DROP COLUMN IF EXISTS "reminderHour"
    `);
    await queryRunner.query(`
      ALTER TABLE "notification_preferences"
      DROP COLUMN IF EXISTS "reminderWeekdays"
    `);
  }
}
