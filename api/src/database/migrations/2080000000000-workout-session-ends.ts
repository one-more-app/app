import type { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkoutSessionEnds2080000000000 implements MigrationInterface {
  name = 'WorkoutSessionEnds2080000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "workout_session_ends" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ownerUserId" uuid NOT NULL,
        "sessionDate" date NOT NULL,
        "endedAt" TIMESTAMPTZ NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workout_session_ends" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_workout_session_ends_owner_date" UNIQUE ("ownerUserId", "sessionDate"),
        CONSTRAINT "FK_workout_session_ends_owner" FOREIGN KEY ("ownerUserId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "workout_session_ends"`);
  }
}
