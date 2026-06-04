import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Rattrapage : répare une corruption pg_attribute sur user_profiles
 * (relnatts pointe vers des attnum absents de pg_attribute).
 *
 * Idempotente : no-op si la table est déjà lisible avec les 3 colonnes sociales.
 * Après exécution en prod : npm run backfill:usernames:prod
 */
export class RepairUserProfilesCatalog1794000000000
  implements MigrationInterface
{
  name = 'RepairUserProfilesCatalog1794000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      REINDEX INDEX pg_catalog.pg_attribute_relid_attnum_index
    `);
    await queryRunner.query(`
      REINDEX INDEX pg_catalog.pg_attribute_relid_attnam_index
    `);

    await queryRunner.query(`
      DO $$
      DECLARE
        rel_oid oid;
        relnatts int;
        missing_slots int;
        has_username boolean;
        has_searchable boolean;
        has_discoverable boolean;
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

        SELECT EXISTS (
          SELECT 1 FROM pg_attribute a
          WHERE a.attrelid = rel_oid AND a.attname = 'username' AND NOT a.attisdropped
        ) INTO has_username;

        SELECT EXISTS (
          SELECT 1 FROM pg_attribute a
          WHERE a.attrelid = rel_oid AND a.attname = 'searchableByName' AND NOT a.attisdropped
        ) INTO has_searchable;

        SELECT EXISTS (
          SELECT 1 FROM pg_attribute a
          WHERE a.attrelid = rel_oid AND a.attname = 'discoverableByUsername' AND NOT a.attisdropped
        ) INTO has_discoverable;

        BEGIN
          PERFORM "username", "searchableByName", "discoverableByUsername"
          FROM "user_profiles"
          LIMIT 1;
          can_read := true;
        EXCEPTION
          WHEN OTHERS THEN
            can_read := false;
        END;

        IF can_read AND has_username AND has_searchable AND has_discoverable THEN
          RAISE NOTICE 'user_profiles : catalogue OK, aucune réparation.';
          RETURN;
        END IF;

        SELECT count(*)
        INTO missing_slots
        FROM generate_series(1, relnatts) AS s(n)
        WHERE NOT EXISTS (
          SELECT 1
          FROM pg_attribute a
          WHERE a.attrelid = rel_oid
            AND a.attnum = s.n
        );

        IF missing_slots > 0 THEN
          UPDATE pg_catalog.pg_class
          SET relnatts = (
            SELECT coalesce(max(a.attnum), 0)::int2
            FROM pg_attribute a
            WHERE a.attrelid = rel_oid
              AND a.attnum > 0
          )
          WHERE oid = rel_oid;

          RAISE NOTICE 'user_profiles : relnatts corrigé (% slot(s) pg_attribute manquant(s)).', missing_slots;
        END IF;

        BEGIN
          DROP TABLE IF EXISTS "_user_profiles_repair_backup";
          CREATE TABLE "_user_profiles_repair_backup" AS
          SELECT "id", "userId", "weightKg", "heightCm", "gender", "updatedAt",
                 "firstName", "lastName", "inviteCode", "avatarUrl", "accessTier"
          FROM "user_profiles";
        EXCEPTION
          WHEN OTHERS THEN
            RAISE NOTICE 'user_profiles : sauvegarde partielle ignorée (%).', SQLERRM;
        END;

        IF NOT has_username THEN
          ALTER TABLE "user_profiles" ADD COLUMN "username" text;
        END IF;

        IF NOT has_searchable THEN
          ALTER TABLE "user_profiles"
            ADD COLUMN "searchableByName" boolean NOT NULL DEFAULT true;
        END IF;

        IF NOT has_discoverable THEN
          ALTER TABLE "user_profiles"
            ADD COLUMN "discoverableByUsername" boolean NOT NULL DEFAULT true;
        END IF;

        BEGIN
          PERFORM "username", "searchableByName", "discoverableByUsername"
          FROM "user_profiles"
          LIMIT 1;
        EXCEPTION
          WHEN OTHERS THEN
            RAISE EXCEPTION 'user_profiles illisible après réparation : %', SQLERRM;
        END;

        CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_profiles_username"
          ON "user_profiles" (lower("username"))
          WHERE "username" IS NOT NULL;

        RAISE NOTICE 'user_profiles : réparation terminée. Lancez backfill:usernames si besoin.';
      END $$
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Réparation de catalogue : opération non réversible.
  }
}
