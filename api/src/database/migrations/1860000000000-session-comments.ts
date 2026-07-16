import { MigrationInterface, QueryRunner } from 'typeorm';

export class SessionComments1860000000000 implements MigrationInterface {
  name = 'SessionComments1860000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "session_comments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "ownerUserId" uuid NOT NULL,
        "sessionDate" date NOT NULL,
        "authorUserId" uuid NOT NULL,
        "parentId" uuid,
        "body" varchar(500) NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        CONSTRAINT "PK_session_comments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_session_comments_owner" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_session_comments_author" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_session_comments_parent" FOREIGN KEY ("parentId") REFERENCES "session_comments"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_comments_owner_date_created"
      ON "session_comments" ("ownerUserId", "sessionDate", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_comments_parent"
      ON "session_comments" ("parentId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "session_comments"`);
  }
}
