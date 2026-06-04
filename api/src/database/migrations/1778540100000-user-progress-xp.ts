import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserProgressXp1778540100000 implements MigrationInterface {
  name = 'UserProgressXp1778540100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_progress" (
        "userId" uuid NOT NULL,
        "totalXp" integer NOT NULL DEFAULT 0,
        "currentStreak" integer NOT NULL DEFAULT 0,
        "longestStreak" integer NOT NULL DEFAULT 0,
        "lastActiveDate" date,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_progress_userId" PRIMARY KEY ("userId")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_progress" ADD CONSTRAINT "FK_user_progress_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE TABLE "xp_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "sourceType" text NOT NULL,
        "sourceId" text NOT NULL,
        "amount" integer NOT NULL,
        "earnedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "activityDate" date NOT NULL,
        CONSTRAINT "PK_xp_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_xp_events_userId_sourceType_sourceId" UNIQUE ("userId", "sourceType", "sourceId")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_xp_events_userId_activityDate" ON "xp_events" ("userId", "activityDate")`,
    );
    await queryRunner.query(
      `ALTER TABLE "xp_events" ADD CONSTRAINT "FK_xp_events_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "xp_events" DROP CONSTRAINT "FK_xp_events_userId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_xp_events_userId_activityDate"`,
    );
    await queryRunner.query(`DROP TABLE "xp_events"`);
    await queryRunner.query(
      `ALTER TABLE "user_progress" DROP CONSTRAINT "FK_user_progress_userId"`,
    );
    await queryRunner.query(`DROP TABLE "user_progress"`);
  }
}
