import { MigrationInterface, QueryRunner } from 'typeorm';

export class TrainingReminderSlots2010000000000 implements MigrationInterface {
  name = 'TrainingReminderSlots2010000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notification_preferences"
      ADD COLUMN IF NOT EXISTS "reminderSlots" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);
    await queryRunner.query(`
      UPDATE "notification_preferences"
      SET "reminderSlots" = COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'weekday', day,
            'hour', "reminderHour",
            'minute', "reminderMinute"
          )
          ORDER BY day
        )
        FROM unnest("reminderWeekdays") AS day
      ), '[]'::jsonb)
      WHERE "reminderSlots" = '[]'::jsonb
        AND COALESCE(array_length("reminderWeekdays", 1), 0) > 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notification_preferences"
      DROP COLUMN IF EXISTS "reminderSlots"
    `);
  }
}
