import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UserGyms1840000000000 implements MigrationInterface {
  name = 'UserGyms1840000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_gyms" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "placeId" text NOT NULL,
        "name" varchar(200) NOT NULL,
        "address" varchar(300),
        "lat" double precision NOT NULL,
        "lng" double precision NOT NULL,
        "radiusM" int NOT NULL DEFAULT 120,
        "onboardingGymPending" boolean NOT NULL DEFAULT false,
        "geofenceEnabled" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_gyms" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_gyms_user" UNIQUE ("userId"),
        CONSTRAINT "FK_user_gyms_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_gyms"`);
  }
}
