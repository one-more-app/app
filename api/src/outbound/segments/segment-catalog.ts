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
];
