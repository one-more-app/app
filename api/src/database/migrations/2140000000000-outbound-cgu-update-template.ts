import type { MigrationInterface, QueryRunner } from 'typeorm';

const CGU_KEY = 'cgu_update_emails_notice';

const content = {
  email: {
    subject: 'Mise à jour de nos conditions générales',
    preheader: "On t'explique aussi les emails One More.",
    eyebrow: 'One More',
    title: 'On a mis à jour nos CGU',
    bodyHtml:
      "<p>Nos conditions générales ont changé. Tu peux les lire en un clic, rien n'est urgent de ton côté.</p><p>On t'envoie aussi des emails One More : conseils, nouveautés, petits rappels utiles. Tu peux les couper à tout moment dans Réglages, section Notifications.</p>",
    bodyText:
      "Nos conditions générales ont changé. Tu peux les lire en un clic, rien n'est urgent de ton côté. On t'envoie aussi des emails One More : conseils, nouveautés, petits rappels utiles. Tu peux les couper à tout moment dans Réglages, section Notifications.",
    cta: {
      label: 'Lire les conditions générales',
      href: 'https://one-more.app/legal/conditions-generales',
    },
    secondaryText: 'Tu restes maître de tes emails. Réglages → Notifications.',
  },
};

export class OutboundCguUpdateTemplate2140000000000 implements MigrationInterface {
  name = 'OutboundCguUpdateTemplate2140000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO "message_templates" ("key", "category", "channel", "content", "variables")
      VALUES ($1, 'transactional', 'email', $2::jsonb, '{}')
      ON CONFLICT ("key") DO NOTHING
    `,
      [CGU_KEY, JSON.stringify(content)],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "message_templates" WHERE "key" = $1`,
      [CGU_KEY],
    );
  }
}
