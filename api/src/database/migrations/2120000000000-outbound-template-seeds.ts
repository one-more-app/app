import type { MigrationInterface, QueryRunner } from 'typeorm';

const templates: Array<{
  key: string;
  category: string;
  channel: string;
  variables: string[];
  content: object;
}> = [
  {
    key: 'weekly_recap',
    category: 'transactional',
    channel: 'push',
    variables: ['sessionCount', 'xpTotal', 'streak', 'sessionLabel'],
    content: {
      push: {
        title: 'Récap de la semaine',
        body: '{{sessionCount}} {{sessionLabel}}, +{{xpTotal}} XP, série {{streak}}',
        route: '/history',
      },
    },
  },
  {
    key: 'monthly_ranking_recap',
    category: 'transactional',
    channel: 'push',
    variables: ['xpTotal', 'month', 'monthLabel'],
    content: {
      push: {
        title: 'Classement de {{monthLabel}}',
        body: 'Ton récap est prêt : +{{xpTotal}} XP. Découvre ton rang.',
        route: '/ranking?recap={{month}}',
      },
    },
  },
  {
    key: 'streak_at_risk',
    category: 'transactional',
    channel: 'push',
    variables: ['streak', 'today'],
    content: {
      push: {
        title: 'Série en danger',
        body: 'Ta série de {{streak}} jours expire ce soir. Une séance suffit !',
        route: '/home',
      },
    },
  },
  {
    key: 'training_reminder',
    category: 'transactional',
    channel: 'push',
    variables: ['today'],
    content: {
      push: {
        title: "C'est l'heure",
        body: "Ta séance t'attend. Une rep de plus.",
        route: '/home',
      },
    },
  },
  {
    key: 'new_user_d1_morning',
    category: 'transactional',
    channel: 'push',
    variables: [],
    content: {
      push: {
        title: 'One More',
        body: "N'oublie pas de t'entraîner aujourd'hui.",
        route: '/home',
      },
    },
  },
  {
    key: 'new_user_d1_midday_train',
    category: 'transactional',
    channel: 'push',
    variables: [],
    content: {
      push: {
        title: 'Note ta séance',
        body: 'Une minute pour logger ta perf.',
        route: '/home',
      },
    },
  },
  {
    key: 'new_user_d1_referral',
    category: 'transactional',
    channel: 'push',
    variables: [],
    content: {
      push: {
        title: 'Invite un pote',
        body: 'Parraine et gagne un t-shirt One More.',
        route: '/settings?focus=referral',
      },
    },
  },
  {
    key: 'new_user_d1_evening',
    category: 'transactional',
    channel: 'push',
    variables: [],
    content: {
      push: {
        title: 'Encore le temps',
        body: 'Termine ta journée avec une séance.',
        route: '/home',
      },
    },
  },
];

export class OutboundTemplateSeeds2120000000000 implements MigrationInterface {
  name = 'OutboundTemplateSeeds2120000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const tpl of templates) {
      await queryRunner.query(
        `
        INSERT INTO "message_templates" ("key", "category", "channel", "content", "variables")
        VALUES ($1, $2, $3, $4::jsonb, $5)
        ON CONFLICT ("key") DO NOTHING
      `,
        [
          tpl.key,
          tpl.category,
          tpl.channel,
          JSON.stringify(tpl.content),
          tpl.variables,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const keys = templates.map((t) => t.key);
    await queryRunner.query(
      `DELETE FROM "message_templates" WHERE "key" = ANY($1)`,
      [keys],
    );
  }
}
