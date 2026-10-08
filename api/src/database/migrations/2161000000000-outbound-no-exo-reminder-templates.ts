import type { MigrationInterface, QueryRunner } from 'typeorm';

const HOME = 'https://one-more.app/#/home';

type DripTemplate = {
  key: string;
  email: {
    subject: string;
    preheader: string;
    title: string;
    bodyHtml: string;
    bodyText: string;
    ctaLabel: string;
  };
  push: { title: string; body: string };
};

/** Pas d’exo réel mais rappel séance déjà configuré — paliers H+2 / H+24 / J+7 / J+30. */
const templates: DripTemplate[] = [
  {
    key: 'registered_no_exercise_reminder_2h',
    email: {
      subject: 'Ton rappel est prêt',
      preheader: 'Tu as programmé des séances, il reste à en loguer une.',
      title: 'Le rappel ne remplace pas la séance',
      bodyHtml:
        '<p>Tu as activé les rappels d’entraînement : on te préviendra aux créneaux choisis. Pour l’instant, aucune vraie séance n’est enregistrée (le record du début ne compte pas).</p><p>Dès que tu logges un exo, ta série et tes records démarrent pour de vrai.</p>',
      bodyText:
        'Tu as activé les rappels d’entraînement. Aucune vraie séance pour l’instant (le record du début ne compte pas). Logge un exo et c’est parti.',
      ctaLabel: 'Faire ma première séance',
    },
    push: {
      title: 'Rappel activé',
      body: 'Tu as des créneaux de rappel. Logge ta première vraie séance.',
    },
  },
  {
    key: 'registered_no_exercise_reminder_24h',
    email: {
      subject: '24 h et toujours 0 séance',
      preheader: 'Tes rappels tournent, tes perfs attendent.',
      title: 'On t’aide à passer le cap',
      bodyHtml:
        '<p>Ça fait un jour que ton compte existe. Tu as configuré des rappels, mais pas encore de vraie séance. Un seul exo suffit pour lancer le compteur.</p>',
      bodyText:
        'Un jour de compte, rappels OK, mais pas encore de vraie séance. Un exo et tu es lancé.',
      ctaLabel: 'Logger un exo',
    },
    push: {
      title: 'Toujours 0 séance',
      body: 'Tes rappels sont là. Il manque juste une vraie séance.',
    },
  },
  {
    key: 'registered_no_exercise_reminder_7d',
    email: {
      subject: 'Une semaine, rappels OK',
      preheader: 'Tes créneaux sont là. Tes records aussi.',
      title: 'La séance manque',
      bodyHtml:
        '<p>Une semaine sans vraie séance malgré tes rappels. Quand tu veux : ouvre l’app, un mouvement, un set, et tu repars de tes records.</p>',
      bodyText:
        'Une semaine sans vraie séance malgré tes rappels. Un set suffit pour relancer.',
      ctaLabel: 'Ouvrir One More',
    },
    push: {
      title: 'Rappels OK, séance ?',
      body: 'Une semaine sans vraie séance. Un exo et tu es relancé.',
    },
  },
  {
    key: 'registered_no_exercise_reminder_30d',
    email: {
      subject: 'Toujours pas de séance',
      preheader: 'Tes rappels et tes records n’ont pas bougé.',
      title: 'On attend toujours',
      bodyHtml:
        '<p>Un mois s’est écoulé. Tu as gardé tes rappels, mais aucune vraie séance. Tes records sont toujours là : reviens quand tu veux, même pour une série.</p>',
      bodyText:
        'Un mois, rappels actifs, toujours pas de vraie séance. Tes records t’attendent.',
      ctaLabel: 'Revenir s’entraîner',
    },
    push: {
      title: 'Tes rappels tournent',
      body: 'Un mois sans vraie séance. Tes records sont toujours là.',
    },
  },
];

export class OutboundNoExoReminderTemplates2161000000000 implements MigrationInterface {
  name = 'OutboundNoExoReminderTemplates2161000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const t of templates) {
      const content = {
        email: {
          subject: t.email.subject,
          preheader: t.email.preheader,
          eyebrow: 'One More',
          title: t.email.title,
          bodyHtml: t.email.bodyHtml,
          bodyText: t.email.bodyText,
          cta: { label: t.email.ctaLabel, href: HOME },
        },
        push: { title: t.push.title, body: t.push.body, route: '/home' },
      };
      await queryRunner.query(
        `
        INSERT INTO "message_templates" ("key", "category", "channel", "content", "variables")
        VALUES ($1, 'marketing', 'both', $2::jsonb, '{}')
        ON CONFLICT ("key") DO NOTHING
      `,
        [t.key, JSON.stringify(content)],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "message_templates" WHERE "key" = ANY($1::text[])`,
      [templates.map((t) => t.key)],
    );
  }
}
