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

const templates: DripTemplate[] = [
  {
    key: 'registered_no_exercise_1h',
    email: {
      subject: 'Ta première vraie séance',
      preheader: 'Le record du début, ce n’est pas encore une séance.',
      title: 'On passe à la pratique',
      bodyHtml:
        '<p>Ton compte est créé. Le record de l’onboarding ne compte pas : une séance, même courte, et c’est parti.</p>',
      bodyText:
        'Ton compte est créé. Le record de l’onboarding ne compte pas : une séance, même courte, et c’est parti.',
      ctaLabel: 'Commencer une séance',
    },
    push: {
      title: 'Il manque une séance',
      body: 'Ton compte est prêt. Logge un vrai exo, pas juste le record du début.',
    },
  },
  {
    key: 'registered_no_exercise_24h',
    email: {
      subject: 'Toujours 0 séance',
      preheader: '24 h et pas encore d’exo loggé.',
      title: '20 minutes suffisent',
      bodyHtml:
        '<p>Ça fait un jour que tu as un compte, et toujours pas de vraie séance. Un exo, un set, et tu es dans le game.</p>',
      bodyText:
        'Ça fait un jour que tu as un compte, et toujours pas de vraie séance. Un exo, un set, et tu es dans le game.',
      ctaLabel: 'Logger un exo',
    },
    push: {
      title: 'Toujours 0 séance',
      body: '24 h et pas encore d’exo loggé. 20 minutes suffisent.',
    },
  },
  {
    key: 'registered_no_exercise_3d',
    email: {
      subject: '3 jours, 0 exo',
      preheader: 'Tes records t’attendent.',
      title: 'On relance ?',
      bodyHtml:
        '<p>Trois jours sans séance réelle. Une courte, aujourd’hui, et tes records redeviennent un objectif.</p>',
      bodyText:
        'Trois jours sans séance réelle. Une courte, aujourd’hui, et tes records redeviennent un objectif.',
      ctaLabel: 'Ouvrir One More',
    },
    push: {
      title: '3 jours sans exo',
      body: 'Tes records t’attendent. Une séance et tu es relancé.',
    },
  },
  {
    key: 'registered_no_exercise_7d',
    email: {
      subject: 'On te garde une place',
      preheader: 'Une semaine sans séance.',
      title: 'Reprends quand tu veux',
      bodyHtml:
        '<p>Une semaine s’est écoulée sans vrai exo. Pas de pression : 1 mouvement, et tu es de retour.</p>',
      bodyText:
        'Une semaine s’est écoulée sans vrai exo. Pas de pression : 1 mouvement, et tu es de retour.',
      ctaLabel: 'Reprendre',
    },
    push: {
      title: 'On te garde une place',
      body: 'Une semaine sans séance. Reprends quand tu veux, même 1 exo.',
    },
  },
  {
    key: 'registered_no_exercise_30d',
    email: {
      subject: 'Toujours là si tu veux',
      preheader: 'Un mois, tes perfs n’ont pas bougé.',
      title: 'On n’a rien effacé',
      bodyHtml:
        '<p>Ça fait un mois. Tes records sont toujours là. Tu reviens quand tu veux, même pour une seule série.</p>',
      bodyText:
        'Ça fait un mois. Tes records sont toujours là. Tu reviens quand tu veux, même pour une seule série.',
      ctaLabel: 'Rouvrir l’app',
    },
    push: {
      title: 'Toujours là',
      body: 'Ça fait un mois. Tes perfs n’ont pas bougé. Tu reviens quand tu veux.',
    },
  },
  {
    key: 'lapsed_after_session_48h',
    email: {
      subject: 'Reviens finir le job',
      preheader: 'Ta dernière séance est encore chaude.',
      title: 'La série tient si tu reviens',
      bodyHtml:
        '<p>Ta dernière vraie séance date d’hier. Une autre aujourd’hui, même courte, et tu ne casses pas le rythme.</p>',
      bodyText:
        'Ta dernière vraie séance date d’hier. Une autre aujourd’hui, même courte, et tu ne casses pas le rythme.',
      ctaLabel: 'Enchaîner une séance',
    },
    push: {
      title: 'Reviens finir le job',
      body: 'Ta dernière séance date d’hier. Une autre aujourd’hui et la série tient.',
    },
  },
  {
    key: 'lapsed_after_session_3d',
    email: {
      subject: '3 jours depuis ta séance',
      preheader: 'Tu avais lancé la machine.',
      title: 'Ne laisse pas refroidir',
      bodyHtml:
        '<p>Trois jours sans revenir. Une séance courte suffit pour ne pas tout perdre.</p>',
      bodyText:
        'Trois jours sans revenir. Une séance courte suffit pour ne pas tout perdre.',
      ctaLabel: 'Reprendre l’entraînement',
    },
    push: {
      title: '3 jours depuis ta séance',
      body: 'Tu avais lancé la machine. Une séance courte pour ne pas tout perdre.',
    },
  },
  {
    key: 'lapsed_after_session_7d',
    email: {
      subject: 'Ta séance s’éloigne',
      preheader: 'Une semaine. Tes records sont toujours là.',
      title: 'On n’a rien oublié',
      bodyHtml:
        '<p>Une semaine sans séance. Tes perfs n’ont pas bougé. Tu reprends au même endroit.</p>',
      bodyText:
        'Une semaine sans séance. Tes perfs n’ont pas bougé. Tu reprends au même endroit.',
      ctaLabel: 'Ouvrir mes exos',
    },
    push: {
      title: 'Ta séance s’éloigne',
      body: 'Une semaine. Tes records sont toujours là.',
    },
  },
  {
    key: 'lapsed_after_session_30d',
    email: {
      subject: 'Un mois sans séance',
      preheader: 'Une seule et tu repars.',
      title: 'Tes haltères t’attendent',
      bodyHtml:
        '<p>Un mois s’est écoulé depuis ta dernière vraie séance. Une seule, et tu repars de tes records, pas de zéro.</p>',
      bodyText:
        'Un mois s’est écoulé depuis ta dernière vraie séance. Une seule, et tu repars de tes records, pas de zéro.',
      ctaLabel: 'Revenir s’entraîner',
    },
    push: {
      title: 'On a rangé tes haltères',
      body: 'Un mois sans séance. Une seule et tu repars.',
    },
  },
];

export class OutboundDripTemplates2150000000000 implements MigrationInterface {
  name = 'OutboundDripTemplates2150000000000';

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
