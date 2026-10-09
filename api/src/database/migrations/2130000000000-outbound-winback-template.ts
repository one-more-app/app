import type { MigrationInterface, QueryRunner } from 'typeorm';

const WINBACK_KEY = 'winback_inactive_14d';

const content = {
  email: {
    subject: "Ta prochaine séance t'attend",
    preheader: 'Deux semaines sans séance. On reprend tranquille ?',
    eyebrow: 'One More',
    title: 'On reprend ?',
    bodyHtml:
      "<p>Ça fait deux semaines qu'on ne t'a pas vu passer. Pas de pression : une séance courte suffit pour relancer la machine.</p><p>Tes records et ta progression sont toujours là.</p>",
    bodyText:
      "Ça fait deux semaines qu'on ne t'a pas vu passer. Pas de pression : une séance courte suffit pour relancer la machine. Tes records et ta progression sont toujours là.",
    cta: {
      label: "Reprendre l'entraînement",
      href: 'https://one-more.app/#/home',
    },
  },
};

export class OutboundWinbackTemplate2130000000000 implements MigrationInterface {
  name = 'OutboundWinbackTemplate2130000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO "message_templates" ("key", "category", "channel", "content", "variables")
      VALUES ($1, 'marketing', 'email', $2::jsonb, '{}')
      ON CONFLICT ("key") DO NOTHING
    `,
      [WINBACK_KEY, JSON.stringify(content)],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "message_templates" WHERE "key" = $1`,
      [WINBACK_KEY],
    );
  }
}
