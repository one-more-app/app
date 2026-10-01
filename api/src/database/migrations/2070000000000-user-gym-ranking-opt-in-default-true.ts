import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UserGymRankingOptInDefaultTrue2070000000000
  implements MigrationInterface
{
  name = 'UserGymRankingOptInDefaultTrue2070000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_gyms"
      ALTER COLUMN "rankingOptIn" SET DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_gyms"
      ALTER COLUMN "rankingOptIn" SET DEFAULT false
    `);
  }
}
