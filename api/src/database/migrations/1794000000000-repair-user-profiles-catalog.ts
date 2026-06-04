import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Rattrapage : répare une corruption pg_attribute sur user_profiles.
 * Colonnes de base : attnum 1–11. Colonnes sociales : username, searchableByName,
 * discoverableByUsername (attnum >= 12).
 *
 * Nécessite un rôle superuser. Idempotente si la table est déjà lisible.
 * Après exécution en prod : npm run backfill:usernames:prod
 */
export class RepairUserProfilesCatalog1794000000000
  implements MigrationInterface
{
  name = 'RepairUserProfilesCatalog1794000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        rel_oid oid;
        relnatts int;
        valid_relnatts int;
        duplicate_slots int;
        can_read boolean := false;
      BEGIN
        SELECT c.oid, c.relnatts
        INTO rel_oid, relnatts
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'user_profiles'
          AND n.nspname = 'public';

        IF rel_oid IS NULL THEN
          RETURN;
        END IF;

        BEGIN
          PERFORM "username", "searchableByName", "discoverableByUsername"
          FROM "user_profiles"
          LIMIT 1;
          can_read := true;
        EXCEPTION
          WHEN OTHERS THEN
            can_read := false;
        END;

        IF can_read THEN
          RAISE NOTICE 'user_profiles : catalogue OK, aucune réparation.';
          RETURN;
        END IF;

        RAISE NOTICE 'user_profiles : table illisible (relnatts=%), réparation catalogue…', relnatts;

        SELECT count(*)
        INTO duplicate_slots
        FROM (
          SELECT attnum
          FROM pg_attribute
          WHERE attrelid = rel_oid AND attnum > 0
          GROUP BY attnum
          HAVING count(*) > 1
        ) d;

        IF duplicate_slots > 0 THEN
          DELETE FROM pg_catalog.pg_attribute a
          USING (
            SELECT attnum,
                   (array_agg(ctid ORDER BY attisdropped ASC, attname ASC))[1] AS keep_ctid
            FROM pg_catalog.pg_attribute
            WHERE attrelid = rel_oid AND attnum > 0
            GROUP BY attnum
            HAVING count(*) > 1
          ) dups
          WHERE a.attrelid = rel_oid
            AND a.attnum = dups.attnum
            AND a.ctid <> dups.keep_ctid;

          RAISE NOTICE 'user_profiles : % attnum dupliqué(s) supprimé(s).', duplicate_slots;
        END IF;

        BEGIN
          ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "username";
          ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "searchableByName";
          ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "discoverableByUsername";
        EXCEPTION
          WHEN OTHERS THEN
            RAISE NOTICE 'user_profiles : DROP COLUMN ignoré (%).', SQLERRM;
        END;

        DELETE FROM pg_catalog.pg_attribute
        WHERE attrelid = rel_oid
          AND attnum > 11;

        SELECT coalesce(
          (
            SELECT min(s.n) - 1
            FROM generate_series(
              1,
              coalesce(
                (SELECT max(a.attnum) FROM pg_attribute a WHERE a.attrelid = rel_oid AND a.attnum > 0),
                0
              )
            ) AS s(n)
            WHERE NOT EXISTS (
              SELECT 1
              FROM pg_attribute a
              WHERE a.attrelid = rel_oid
                AND a.attnum = s.n
            )
          ),
          (
            SELECT max(a.attnum)
            FROM pg_attribute a
            WHERE a.attrelid = rel_oid AND a.attnum > 0
          ),
          0
        )
        INTO valid_relnatts;

        UPDATE pg_catalog.pg_class
        SET relnatts = valid_relnatts::int2
        WHERE oid = rel_oid;

        RAISE NOTICE 'user_profiles : relnatts → %.', valid_relnatts;

        BEGIN
          REINDEX INDEX pg_catalog.pg_attribute_relid_attnum_index;
          REINDEX INDEX pg_catalog.pg_attribute_relid_attnam_index;
        EXCEPTION
          WHEN OTHERS THEN
            RAISE NOTICE 'user_profiles : REINDEX pg_attribute ignoré (%).', SQLERRM;
        END;

        BEGIN
          DROP TABLE IF EXISTS "_user_profiles_repair_backup";
          CREATE TABLE "_user_profiles_repair_backup" AS
          SELECT "id", "userId", "weightKg", "heightCm", "gender", "updatedAt",
                 "firstName", "lastName", "inviteCode", "avatarUrl", "accessTier"
          FROM "user_profiles";
          RAISE NOTICE 'user_profiles : sauvegarde partielle OK.';
        EXCEPTION
          WHEN OTHERS THEN
            RAISE NOTICE 'user_profiles : sauvegarde partielle ignorée (%).', SQLERRM;
        END;

        ALTER TABLE "user_profiles" ADD COLUMN "username" text;
        ALTER TABLE "user_profiles"
          ADD COLUMN "searchableByName" boolean NOT NULL DEFAULT true;
        ALTER TABLE "user_profiles"
          ADD COLUMN "discoverableByUsername" boolean NOT NULL DEFAULT true;

        CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_profiles_username"
          ON "user_profiles" (lower("username"))
          WHERE "username" IS NOT NULL;

        PERFORM "username", "searchableByName", "discoverableByUsername"
        FROM "user_profiles"
        LIMIT 1;

        RAISE NOTICE 'user_profiles : réparation terminée. Lancez backfill:usernames.';
      END $$
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Réparation de catalogue : opération non réversible.
  }
}
