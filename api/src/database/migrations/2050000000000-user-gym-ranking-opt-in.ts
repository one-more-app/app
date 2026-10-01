import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UserGymRankingOptIn2050000000000 implements MigrationInterface {
  name = 'UserGymRankingOptIn2050000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_gyms"
      ADD COLUMN "rankingOptIn" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_gyms" DROP COLUMN "rankingOptIn"
    `);
  }
}
