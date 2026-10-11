import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Séances first-class + backfill 1 session / (user, date).
 * Comments / reactions / perfs rattachés ; ends migrés vers workout_sessions.endedAt.
 */
export class WorkoutSessions2090000000000 implements MigrationInterface {
  name = 'WorkoutSessions2090000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "workout_sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ownerUserId" uuid NOT NULL,
        "sessionDate" date NOT NULL,
        "startedAt" TIMESTAMPTZ NOT NULL,
        "endedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_workout_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_workout_sessions_owner" FOREIGN KEY ("ownerUserId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_workout_sessions_owner_date"
        ON "workout_sessions" ("ownerUserId", "sessionDate")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_workout_sessions_owner_ended"
        ON "workout_sessions" ("ownerUserId", "endedAt")
    `);

    await queryRunner.query(`
      INSERT INTO "workout_sessions" ("ownerUserId", "sessionDate", "startedAt", "endedAt")
      SELECT
        days."ownerUserId",
        days."sessionDate",
        COALESCE(days."startedAt", days."sessionDate"::timestamptz),
        ends."endedAt"
      FROM (
        SELECT
          "ownerUserId",
          "sessionDate",
          MIN("startedAt") AS "startedAt"
        FROM (
          SELECT "userId" AS "ownerUserId", "date" AS "sessionDate",
                 MIN("updatedAt") AS "startedAt"
          FROM "performance_entries"
          GROUP BY "userId", "date"
          UNION ALL
          SELECT "ownerUserId", "sessionDate", MIN("createdAt")
          FROM "session_comments"
          GROUP BY "ownerUserId", "sessionDate"
          UNION ALL
          SELECT "ownerUserId", "sessionDate", MIN("createdAt")
          FROM "session_reactions"
          GROUP BY "ownerUserId", "sessionDate"
          UNION ALL
          SELECT "ownerUserId", "sessionDate", "endedAt"
          FROM "workout_session_ends"
        ) raw
        GROUP BY "ownerUserId", "sessionDate"
      ) days
      LEFT JOIN "workout_session_ends" ends
        ON ends."ownerUserId" = days."ownerUserId"
       AND ends."sessionDate" = days."sessionDate"
    `);

    await queryRunner.query(`
      ALTER TABLE "performance_entries"
        ADD COLUMN "workoutSessionId" uuid
    `);
    await queryRunner.query(`
      UPDATE "performance_entries" pe
      SET "workoutSessionId" = ws."id"
      FROM "workout_sessions" ws
      WHERE ws."ownerUserId" = pe."userId"
        AND ws."sessionDate" = pe."date"
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_performance_entries_workoutSessionId"
        ON "performance_entries" ("workoutSessionId")
    `);
    await queryRunner.query(`
      ALTER TABLE "performance_entries"
        ADD CONSTRAINT "FK_performance_entries_workout_session"
        FOREIGN KEY ("workoutSessionId") REFERENCES "workout_sessions"("id")
        ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "session_comments"
        ADD COLUMN "workoutSessionId" uuid
    `);
    await queryRunner.query(`
      UPDATE "session_comments" sc
      SET "workoutSessionId" = ws."id"
      FROM "workout_sessions" ws
      WHERE ws."ownerUserId" = sc."ownerUserId"
        AND ws."sessionDate" = sc."sessionDate"
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_session_comments_workoutSessionId"
        ON "session_comments" ("workoutSessionId")
    `);
    await queryRunner.query(`
      ALTER TABLE "session_comments"
        ADD CONSTRAINT "FK_session_comments_workout_session"
        FOREIGN KEY ("workoutSessionId") REFERENCES "workout_sessions"("id")
        ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "session_reactions"
        ADD COLUMN "workoutSessionId" uuid
    `);
    await queryRunner.query(`
      UPDATE "session_reactions" sr
      SET "workoutSessionId" = ws."id"
      FROM "workout_sessions" ws
      WHERE ws."ownerUserId" = sr."ownerUserId"
        AND ws."sessionDate" = sr."sessionDate"
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_session_reactions_workoutSessionId"
        ON "session_reactions" ("workoutSessionId")
    `);
    await queryRunner.query(`
      ALTER TABLE "session_reactions"
        ADD CONSTRAINT "FK_session_reactions_workout_session"
        FOREIGN KEY ("workoutSessionId") REFERENCES "workout_sessions"("id")
        ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "workout_session_ends"
        ADD COLUMN "workoutSessionId" uuid
    `);
    await queryRunner.query(`
      UPDATE "workout_session_ends" we
      SET "workoutSessionId" = ws."id"
      FROM "workout_sessions" ws
      WHERE ws."ownerUserId" = we."ownerUserId"
        AND ws."sessionDate" = we."sessionDate"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "workout_session_ends" DROP COLUMN IF EXISTS "workoutSessionId"
    `);
    await queryRunner.query(`
      ALTER TABLE "session_reactions"
        DROP CONSTRAINT IF EXISTS "FK_session_reactions_workout_session"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_session_reactions_workoutSessionId"
    `);
    await queryRunner.query(`
      ALTER TABLE "session_reactions" DROP COLUMN IF EXISTS "workoutSessionId"
    `);
    await queryRunner.query(`
      ALTER TABLE "session_comments"
        DROP CONSTRAINT IF EXISTS "FK_session_comments_workout_session"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_session_comments_workoutSessionId"
    `);
    await queryRunner.query(`
      ALTER TABLE "session_comments" DROP COLUMN IF EXISTS "workoutSessionId"
    `);
    await queryRunner.query(`
      ALTER TABLE "performance_entries"
        DROP CONSTRAINT IF EXISTS "FK_performance_entries_workout_session"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_performance_entries_workoutSessionId"
    `);
    await queryRunner.query(`
      ALTER TABLE "performance_entries" DROP COLUMN IF EXISTS "workoutSessionId"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "workout_sessions"`);
  }
}
