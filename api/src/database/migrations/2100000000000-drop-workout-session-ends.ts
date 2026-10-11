import type { MigrationInterface, QueryRunner } from 'typeorm';

/** La fin de séance est sur workout_sessions.endedAt. */
export class DropWorkoutSessionEnds2100000000000 implements MigrationInterface {
  name = 'DropWorkoutSessionEnds2100000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "workout_session_ends"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "workout_session_ends" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ownerUserId" uuid NOT NULL,
        "sessionDate" date NOT NULL,
        "endedAt" TIMESTAMPTZ NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "workoutSessionId" uuid,
        CONSTRAINT "PK_workout_session_ends" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_workout_session_ends_owner_date" UNIQUE ("ownerUserId", "sessionDate"),
        CONSTRAINT "FK_workout_session_ends_owner" FOREIGN KEY ("ownerUserId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      INSERT INTO "workout_session_ends"
        ("ownerUserId", "sessionDate", "endedAt", "workoutSessionId")
      SELECT DISTINCT ON ("ownerUserId", "sessionDate")
        "ownerUserId",
        "sessionDate",
        "endedAt",
        "id"
      FROM "workout_sessions"
      WHERE "endedAt" IS NOT NULL
      ORDER BY "ownerUserId", "sessionDate", "endedAt" DESC
    `);
  }
}
