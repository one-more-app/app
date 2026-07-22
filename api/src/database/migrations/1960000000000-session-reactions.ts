import { MigrationInterface, QueryRunner } from 'typeorm';

export class SessionReactions1960000000000 implements MigrationInterface {
  name = 'SessionReactions1960000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "session_reactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ownerUserId" uuid NOT NULL,
        "sessionDate" date NOT NULL,
        "authorUserId" uuid NOT NULL,
        "emoji" varchar(16) NOT NULL,
        "targetType" varchar(16) NOT NULL,
        "trackedExerciseId" varchar(128),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_session_reactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_session_reactions_owner" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_session_reactions_author" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_reactions_owner_date"
      ON "session_reactions" ("ownerUserId", "sessionDate")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_session_reactions_session_target"
      ON "session_reactions" ("authorUserId", "ownerUserId", "sessionDate", "emoji", "targetType")
      WHERE "trackedExerciseId" IS NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_session_reactions_exercise_target"
      ON "session_reactions" ("authorUserId", "ownerUserId", "sessionDate", "emoji", "targetType", "trackedExerciseId")
      WHERE "trackedExerciseId" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "session_reactions"`);
  }
}
