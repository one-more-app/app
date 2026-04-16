import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1776285465953 implements MigrationInterface {
  name = 'Migration1776285465953';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tracked_exercises" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "clientId" text NOT NULL, "exerciseId" text NOT NULL, "name" text NOT NULL, "originalName" text, "bodyPart" text, "target" text, "equipment" text, "category" text, "gifUrl" text, "isCustom" boolean NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_tracked_exercises_userId_clientId" UNIQUE ("userId", "clientId"), CONSTRAINT "PK_1006c3fcfa294d29b28eda5fff1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tracked_exercises_userId" ON "tracked_exercises" ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "performance_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "clientId" text NOT NULL, "trackedExerciseId" uuid NOT NULL, "date" date NOT NULL, "weight" double precision NOT NULL, "reps" integer NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_performance_entries_userId_clientId" UNIQUE ("userId", "clientId"), CONSTRAINT "PK_0e8376cad50c6a07ac29e6187a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_performance_entries_trackedExerciseId" ON "performance_entries" ("trackedExerciseId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_performance_entries_userId" ON "performance_entries" ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "weightKg" real, "heightCm" real, "gender" text, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_8481388d6325e752cd4d7e26c6d" UNIQUE ("userId"), CONSTRAINT "REL_8481388d6325e752cd4d7e26c6" UNIQUE ("userId"), CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "refreshTokenHash" text NOT NULL, "deviceId" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastSeenAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "revokedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text, "password" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "oauth_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "provider" text NOT NULL, "providerUserId" text NOT NULL, "email" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "oauth_accounts_provider_provideruserid_key" UNIQUE ("provider", "providerUserId"), CONSTRAINT "PK_710a81523f515b78f894e33bb10" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "oauth_accounts_userid_provider_idx" ON "oauth_accounts" ("userId", "provider") `,
    );
    await queryRunner.query(
      `CREATE TABLE "exercise_catalog" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "exerciseId" text NOT NULL, "name" text NOT NULL, "nameFr" text, "bodyPart" text NOT NULL, "target" text NOT NULL, "equipment" text NOT NULL, "secondaryMuscles" jsonb NOT NULL DEFAULT '[]'::jsonb, "instructions" jsonb NOT NULL DEFAULT '[]'::jsonb, "gifUrl" text, CONSTRAINT "UQ_b04ce9dee713ea650f7be58713d" UNIQUE ("exerciseId"), CONSTRAINT "PK_2563e10bd68bc4e5038eb0ce967" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_exercise_catalog_equipment" ON "exercise_catalog" ("equipment") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_exercise_catalog_target" ON "exercise_catalog" ("target") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_exercise_catalog_name" ON "exercise_catalog" ("name") `,
    );
    await queryRunner.query(
      `ALTER TABLE "tracked_exercises" ADD CONSTRAINT "FK_fb69ecb9a4271783f1a439df94c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "performance_entries" ADD CONSTRAINT "FK_eee47687dc3bcb190fa11dcbce8" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "performance_entries" ADD CONSTRAINT "FK_f7e5b0a05cb85dac15fc48c5f43" FOREIGN KEY ("trackedExerciseId") REFERENCES "tracked_exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_8481388d6325e752cd4d7e26c6d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" ADD CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_accounts" ADD CONSTRAINT "FK_4c22f13249ce02f89dc6d226e9c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "oauth_accounts" DROP CONSTRAINT "FK_4c22f13249ce02f89dc6d226e9c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions" DROP CONSTRAINT "FK_57de40bc620f456c7311aa3a1e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_8481388d6325e752cd4d7e26c6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "performance_entries" DROP CONSTRAINT "FK_f7e5b0a05cb85dac15fc48c5f43"`,
    );
    await queryRunner.query(
      `ALTER TABLE "performance_entries" DROP CONSTRAINT "FK_eee47687dc3bcb190fa11dcbce8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tracked_exercises" DROP CONSTRAINT "FK_fb69ecb9a4271783f1a439df94c"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_exercise_catalog_name"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_exercise_catalog_target"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_exercise_catalog_equipment"`,
    );
    await queryRunner.query(`DROP TABLE "exercise_catalog"`);
    await queryRunner.query(
      `DROP INDEX "public"."oauth_accounts_userid_provider_idx"`,
    );
    await queryRunner.query(`DROP TABLE "oauth_accounts"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TABLE "user_profiles"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_performance_entries_userId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_performance_entries_trackedExerciseId"`,
    );
    await queryRunner.query(`DROP TABLE "performance_entries"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tracked_exercises_userId"`,
    );
    await queryRunner.query(`DROP TABLE "tracked_exercises"`);
  }
}
