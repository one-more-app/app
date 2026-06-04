import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Rattrapage : corruption pg_attribute / heap sur user_profiles.
 * Stratégie : réparer le catalogue, extraire les données, recréer la table.
 *
 * transaction = false : chaque étape commit séparément (réparation progressive).
 * Nécessite un rôle superuser. Après prod : npm run backfill:usernames:prod
 */
export class RepairUserProfilesCatalog1794000000000
  implements MigrationInterface
{
  name = 'RepairUserProfilesCatalog1794000000000';

  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const readable = await this.isReadable(queryRunner);
    if (readable) {
      return;
    }

    await this.tryQuery(
      queryRunner,
      `REINDEX INDEX pg_catalog.pg_attribute_relid_attnum_index`,
    );
    await this.tryQuery(
      queryRunner,
      `REINDEX INDEX pg_catalog.pg_attribute_relid_attnam_index`,
    );
    await this.tryQuery(
      queryRunner,
      `REINDEX INDEX pg_catalog.pg_constraint_conrelid_contypid_conname_index`,
    );
    await this.tryQuery(
      queryRunner,
      `REINDEX INDEX pg_catalog.pg_constraint_oid_index`,
    );

    await queryRunner.query(`
      DO $$
      DECLARE
        rel_oid oid;
        duplicate_slots int;
      BEGIN
        SELECT c.oid
        INTO rel_oid
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'user_profiles'
          AND n.nspname = 'public';

        IF rel_oid IS NULL THEN
          RETURN;
        END IF;

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
        END IF;

        DELETE FROM pg_catalog.pg_attribute
        WHERE attrelid = rel_oid
          AND attnum > 11;

        UPDATE pg_catalog.pg_class
        SET relnatts = 11::int2
        WHERE oid = rel_oid
          AND relnatts <> 11;
      END $$
    `);

    if (await this.isReadable(queryRunner)) {
      await this.ensureIndexes(queryRunner);
      return;
    }

    await queryRunner.query(`
      DROP TABLE IF EXISTS "_user_profiles_repair_backup"
    `);

    await this.tryQuery(
      queryRunner,
      `
      CREATE TABLE "_user_profiles_repair_backup" AS
      SELECT "id",
             "userId",
             "weightKg",
             "heightCm",
             "gender",
             "updatedAt",
             "firstName",
             "lastName",
             "inviteCode",
             "avatarUrl",
             "accessTier"
      FROM "user_profiles"
    `,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "user_profiles_new"`);

    await queryRunner.query(`
      CREATE TABLE "user_profiles_new" (
        "id" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "weightKg" real,
        "heightCm" real,
        "gender" text,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "firstName" text,
        "lastName" text,
        "inviteCode" text,
        "avatarUrl" text,
        "accessTier" "access_tier_enum" NOT NULL DEFAULT 'limited',
        "username" text,
        "searchableByName" boolean NOT NULL DEFAULT true,
        "discoverableByUsername" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_user_profiles_new" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_profiles_new_userId" UNIQUE ("userId")
      )
    `);

    const backupExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = '_user_profiles_repair_backup'
      ) AS exists
    `);

    if (backupExists[0]?.exists) {
      await queryRunner.query(`
        INSERT INTO "user_profiles_new" (
          "id", "userId", "weightKg", "heightCm", "gender", "updatedAt",
          "firstName", "lastName", "inviteCode", "avatarUrl", "accessTier"
        )
        SELECT "id", "userId", "weightKg", "heightCm", "gender", "updatedAt",
               "firstName", "lastName", "inviteCode", "avatarUrl", "accessTier"
        FROM "_user_profiles_repair_backup"
      `);
    } else {
      await queryRunner.query(`
        INSERT INTO "user_profiles_new" (
          "id", "userId", "weightKg", "heightCm", "gender", "updatedAt",
          "firstName", "lastName", "inviteCode", "avatarUrl", "accessTier"
        )
        SELECT "id", "userId", "weightKg", "heightCm", "gender", "updatedAt",
               "firstName", "lastName", "inviteCode", "avatarUrl", "accessTier"
        FROM "user_profiles"
      `);
    }

    await queryRunner.query(`DROP TABLE IF EXISTS "user_profiles" CASCADE`);
    await queryRunner.query(`
      ALTER TABLE "user_profiles_new" RENAME TO "user_profiles"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_profiles" RENAME CONSTRAINT "PK_user_profiles_new" TO "PK_1ec6662219f4605723f1e41b6cb"
    `);
    await queryRunner.query(`
      ALTER TABLE "user_profiles" RENAME CONSTRAINT "UQ_user_profiles_new_userId" TO "UQ_8481388d6325e752cd4d7e26c6d"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ADD CONSTRAINT "FK_8481388d6325e752cd4d7e26c6d"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await this.ensureIndexes(queryRunner);

    if (!(await this.isReadable(queryRunner))) {
      throw new Error(
        'user_profiles illisible après reconstruction — restaurez un backup/PITR.',
      );
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Réparation de catalogue : opération non réversible.
  }

  private async isReadable(queryRunner: QueryRunner): Promise<boolean> {
    try {
      await queryRunner.query(`
        SELECT "id", "userId", "username", "searchableByName", "discoverableByUsername"
        FROM "user_profiles"
        LIMIT 1
      `);
      return true;
    } catch {
      return false;
    }
  }

  private async ensureIndexes(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_profiles_inviteCode"
      ON "user_profiles" ("inviteCode")
      WHERE "inviteCode" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_profiles_username"
      ON "user_profiles" (lower("username"))
      WHERE "username" IS NOT NULL
    `);
  }

  private async tryQuery(
    queryRunner: QueryRunner,
    sql: string,
  ): Promise<void> {
    try {
      await queryRunner.query(sql);
    } catch {
      // Étape best-effort : la reconstruction de table est le filet de sécurité.
    }
  }
}
