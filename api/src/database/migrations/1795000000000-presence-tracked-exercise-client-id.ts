import { MigrationInterface, QueryRunner } from 'typeorm';

export class PresenceTrackedExerciseClientId1795000000000
  implements MigrationInterface
{
  name = 'PresenceTrackedExerciseClientId1795000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_presence"
      ALTER COLUMN "trackedExerciseId" TYPE text
      USING "trackedExerciseId"::text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_presence"
      ALTER COLUMN "trackedExerciseId" TYPE uuid
      USING NULLIF("trackedExerciseId", '')::uuid
    `);
  }
}
