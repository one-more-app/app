import type { MigrationInterface, QueryRunner } from 'typeorm';

export class EventEntries1880000000000 implements MigrationInterface {
  name = 'EventEntries1880000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "event_gender_enum" AS ENUM ('male', 'female')
    `);
    await queryRunner.query(`
      CREATE TYPE "event_exercise_enum" AS ENUM ('pull_up', 'dips', 'push_up')
    `);
    await queryRunner.query(`
      CREATE TABLE "event_entries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "firstName" varchar(80) NOT NULL,
        "email" varchar(255) NOT NULL,
        "gender" "event_gender_enum" NOT NULL,
        "exercise" "event_exercise_enum" NOT NULL,
        "reps" integer NOT NULL,
        "notes" varchar(500),
        "beatPreviousLeader" boolean NOT NULL DEFAULT false,
        "tshirtAwarded" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_entries" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_event_entries_leaderboard"
      ON "event_entries" ("exercise", "gender", "reps" DESC, "createdAt" ASC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "event_entries"`);
    await queryRunner.query(`DROP TYPE "event_exercise_enum"`);
    await queryRunner.query(`DROP TYPE "event_gender_enum"`);
  }
}
