/** Métadonnées exposées par GET /internal/outbound/catalog (alignées sur le code des segments). */

export type SegmentParamSpec = {
  name: string;
  type: 'number' | 'string';
  required: boolean;
  default?: number | string;
  description: string;
};

export type SegmentCatalogEntry = {
  key: string;
  description: string;
  params: SegmentParamSpec[];
};

export const SEGMENT_CATALOG: SegmentCatalogEntry[] = [
  {
    key: 'active_with_email',
    description:
      'Comptes actifs (non supprimés) qui ont une adresse email. Pour les envois one-shot d’information (ex. mise à jour CGU).',
    params: [],
  },
  {
    key: 'inactive_since',
    description:
      'Utilisateurs avec email, compte actif, sans performance enregistrée sur les N derniers jours calendaires (UTC date côté SQL).',
    params: [
      {
        name: 'days',
        type: 'number',
        required: false,
        default: 7,
        description: 'Fenêtre en jours (≥ 1).',
      },
    ],
  },
  {
    key: 'signed_up_days_ago',
    description:
      'Utilisateurs ayant au moins un device token dans le fuseau donné, inscrits il y a N jours (date locale du fuseau).',
    params: [
      {
        name: 'days',
        type: 'number',
        required: false,
        default: 1,
        description: 'Nombre de jours avant aujourd’hui (date locale).',
      },
      {
        name: 'timezone',
        type: 'string',
        required: true,
        description:
          'IANA, ex. Europe/Paris (doit correspondre à device_tokens.timezone).',
      },
    ],
  },
  {
    key: 'streak_at_risk',
    description:
      'Utilisateurs dans le fuseau donné dont la série est en danger aujourd’hui et sans perf enregistrée aujourd’hui.',
    params: [
      {
        name: 'timezone',
        type: 'string',
        required: true,
        description: 'IANA, ex. Europe/Paris.',
      },
    ],
  },
  {
    key: 'registered_no_exercise',
    description:
      'Compte actif avec email, inscrit depuis au moins days/hours, sans exo réel (l’exo unique de l’onboarding ne compte pas).',
    params: [
      {
        name: 'days',
        type: 'number',
        required: false,
        description:
          'Jours depuis l’inscription. Combiné avec hours. Total ≥ 1 h.',
      },
      {
        name: 'hours',
        type: 'number',
        required: false,
        description:
          'Heures depuis l’inscription. Combiné avec days. Total ≥ 1 h.',
      },
      {
        name: 'maxDays',
        type: 'number',
        required: false,
        description:
          'Plafond optionnel (jours). Âge strictement inférieur. Combiné avec maxHours.',
      },
      {
        name: 'maxHours',
        type: 'number',
        required: false,
        description: 'Plafond optionnel (heures). Fenêtre : min ≤ âge < max.',
      },
    ],
  },
  {
    key: 'registered_no_push',
    description:
      'Compte actif avec email, inscrit depuis au moins days/hours, sans token push (notifications OS jamais activées).',
    params: [
      {
        name: 'days',
        type: 'number',
        required: false,
        description:
          'Jours depuis l’inscription. Combiné avec hours. Total ≥ 1 h.',
      },
      {
        name: 'hours',
        type: 'number',
        required: false,
        description:
          'Heures depuis l’inscription. Combiné avec days. Total ≥ 1 h.',
      },
      {
        name: 'maxDays',
        type: 'number',
        required: false,
        description:
          'Plafond optionnel (jours). Âge strictement inférieur. Combiné avec maxHours.',
      },
      {
        name: 'maxHours',
        type: 'number',
        required: false,
        description: 'Plafond optionnel (heures). Fenêtre : min ≤ âge < max.',
      },
    ],
  },
  {
    key: 'lapsed_after_session',
    description:
      'A fait une séance réelle (hors exo d’onboarding) et n’est pas revenu sur l’app depuis days/hours (session, token push ou perf).',
    params: [
      {
        name: 'days',
        type: 'number',
        required: false,
        description:
          'Jours depuis la dernière activité app. Combiné avec hours. Total ≥ 1 h.',
      },
      {
        name: 'hours',
        type: 'number',
        required: false,
        description:
          'Heures depuis la dernière activité app. Combiné avec days. Total ≥ 1 h.',
      },
      {
        name: 'maxDays',
        type: 'number',
        required: false,
        description:
          'Plafond optionnel (jours). Inactivité strictement inférieure. Combiné avec maxHours.',
      },
      {
        name: 'maxHours',
        type: 'number',
        required: false,
        description:
          'Plafond optionnel (heures). Fenêtre : min ≤ inactivité < max.',
      },
    ],
  },
];
