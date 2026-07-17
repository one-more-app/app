import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Les lignes de `friend_training_alerts` passent d'un opt-in (abonnement)
 * à un opt-out (mute). On vide la table pour ne pas transformer d'anciens
 * abonnements en mutes involontaires : tout le monde est notifié par défaut.
 */
export class FriendTrainingAlertsOptOut1870000000000 implements MigrationInterface {
  name = 'FriendTrainingAlertsOptOut1870000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`TRUNCATE TABLE "friend_training_alerts"`);
  }

  public async down(): Promise<void> {
    // Irréversible : les mutes post-migration ne peuvent pas redevenir des opt-ins.
  }
}
