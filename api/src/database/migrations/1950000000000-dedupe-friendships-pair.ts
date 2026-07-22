import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Corrige les amitiés en double (A→B et B→A) créées quand un parrainage
 * suivait une demande d'ami dans l'autre sens, puis impose l'unicité
 * sur la paire non ordonnée.
 */
export class DedupeFriendshipsPair1950000000000 implements MigrationInterface {
  name = 'DedupeFriendshipsPair1950000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY
              LEAST("requesterId", "addresseeId"),
              GREATEST("requesterId", "addresseeId")
            ORDER BY
              CASE status::text
                WHEN 'accepted' THEN 0
                WHEN 'pending' THEN 1
                WHEN 'declined' THEN 2
                WHEN 'blocked' THEN 3
                ELSE 4
              END,
              "createdAt" ASC,
              id ASC
          ) AS rn
        FROM "friendships"
      )
      DELETE FROM "friendships" f
      USING ranked r
      WHERE f.id = r.id
        AND r.rn > 1
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_friendships_pair"
      ON "friendships" (
        LEAST("requesterId", "addresseeId"),
        GREATEST("requesterId", "addresseeId")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_friendships_pair"`);
  }
}
