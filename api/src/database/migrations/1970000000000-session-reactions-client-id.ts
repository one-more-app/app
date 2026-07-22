import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Si la table a déjà été créée avec trackedExerciseId uuid,
 * convertit en varchar(128) pour stocker les clientId d’exercices.
 */
export class SessionReactionsClientId1970000000000 implements MigrationInterface {
  name = 'SessionReactionsClientId1970000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows = (await queryRunner.query(`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'session_reactions'
        AND column_name = 'trackedExerciseId'
    `)) as Array<{ data_type: string }>;
    const dataType = rows[0]?.data_type;
    if (dataType === 'uuid') {
      await queryRunner.query(`
        ALTER TABLE "session_reactions"
        ALTER COLUMN "trackedExerciseId" TYPE varchar(128)
        USING "trackedExerciseId"::text
      `);
    }
  }

  public async down(): Promise<void> {
    // Irreversible safely: clientIds may not be UUIDs.
  }
}
