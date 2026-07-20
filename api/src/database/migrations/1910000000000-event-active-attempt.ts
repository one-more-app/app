import type { MigrationInterface, QueryRunner } from 'typeorm';

export class EventActiveAttempt1910000000000 implements MigrationInterface {
  name = 'EventActiveAttempt1910000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "event_active_attempts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "firstName" varchar(80) NOT NULL,
        "lastName" varchar(80) NOT NULL,
        "email" varchar(255) NOT NULL,
        "gender" "event_gender_enum" NOT NULL,
        "exercise" "event_exercise_enum" NOT NULL,
        "notes" varchar(500),
        "reps" integer NOT NULL DEFAULT 0,
        "startedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_active_attempts" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "event_active_attempts"`);
  }
}
