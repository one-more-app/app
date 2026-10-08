import { workflow, node, trigger, sticky, ifElse, expr } from '@n8n/workflow-sdk';

const API = {
  __rl: true,
  mode: 'id',
  value: 'iQYqQdhUqtZuw4gA',
  cachedResultName: 'One More · Outbound · [Sub] Appel API',
};
const DISPATCH = {
  __rl: true,
  mode: 'id',
  value: 'b0KcWFM96bSwLfQL',
  cachedResultName: 'One More · Outbound · [Sub] Dispatch segment',
};

const mapperSchema = [
  { id: 'method', displayName: 'method', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
  { id: 'path', displayName: 'path', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
  { id: 'body', displayName: 'body', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'object' },
];

const dispatchSchema = [
  { id: 'segmentKey', displayName: 'segmentKey', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
  { id: 'params', displayName: 'params', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'object' },
  { id: 'templateKey', displayName: 'templateKey', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
  { id: 'channel', displayName: 'channel', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
  { id: 'campaignKey', displayName: 'campaignKey', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
  { id: 'idempotencyKey', displayName: 'idempotencyKey', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'string' },
  { id: 'confirmLargeAudience', displayName: 'confirmLargeAudience', required: false, defaultMatch: false, display: true, canBeUsedToMatch: true, type: 'boolean' },
];

const trigP48h = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: {
    name: 'Toutes les heures · palier 48 h',
    parameters: { rule: { interval: [{ field: 'hours', hoursInterval: 1, triggerAtMinute: 25 }] } },
    position: [0, 0],
  },
  output: [{ timestamp: '2026-10-08T10:00:00.000+02:00' }],
});

const setP48h = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Paramètres 48h',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: '48h-seg', name: 'segmentKey', value: 'lapsed_after_session', type: 'string' },
          { id: '48h-params', name: 'params', value: expr('{{ { hours: 48, maxDays: 3 } }}'), type: 'object' },
          { id: '48h-tpl', name: 'templateKey', value: 'lapsed_after_session_48h', type: 'string' },
          { id: '48h-ck', name: 'campaignKey', value: expr('lapsed-48h-{{ $now.setZone("Europe/Paris").toFormat("yyyy-MM") }}'), type: 'string' },
          { id: '48h-ie', name: 'idempotencyEmail', value: expr('n8n:lapsed:48h:email:{{ $now.setZone("Europe/Paris").toFormat("yyyy-MM") }}'), type: 'string' },
          { id: '48h-ip', name: 'idempotencyPush', value: expr('n8n:lapsed:48h:push:{{ $now.setZone("Europe/Paris").toFormat("yyyy-MM") }}'), type: 'string' },
          { id: '48h-conf', name: 'confirmLargeAudience', value: false, type: 'boolean' },
        ],
      },
    },
    position: [240, 0],
  },
  output: [{
    segmentKey: 'lapsed_after_session',
    params: { hours: 48, maxDays: 3 },
    templateKey: 'lapsed_after_session_48h',
    campaignKey: 'lapsed-48h-2026-10',
    idempotencyEmail: 'n8n:lapsed:48h:email:2026-10',
    idempotencyPush: 'n8n:lapsed:48h:push:2026-10',
    confirmLargeAudience: false,
  }],
});

const catP48h = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Catalogue 48h',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: API,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: { method: 'GET', path: '/internal/outbound/catalog', body: expr('{{ {} }}') },
        matchingColumns: [],
        schema: mapperSchema,
        attemptToConvertTypes: false,
      },
      options: { waitForSubWorkflow: true },
    },
    position: [480, 0],
  },
  output: [{ templates: [{ key: 'lapsed_after_session_48h', category: 'marketing', channel: 'both', variables: [], isActive: true }] }],
});

const ifP48h = ifElse({
  version: 2.3,
  config: {
    name: 'Template 48h prêt ?',
    parameters: {
      conditions: {
        combinator: 'and',
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          {
            leftValue: expr('{{ $json.templates.some(t => t.key === $("Paramètres 48h").first().json.templateKey && t.isActive && t.category === "marketing" && t.channel === "both" && (t.variables || []).length === 0) }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
      },
    },
    position: [720, 0],
  },
});

const emailP48h = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Dispatch email 48h',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: DISPATCH,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          segmentKey: expr('{{ $("Paramètres 48h").first().json.segmentKey }}'),
          params: expr('{{ $("Paramètres 48h").first().json.params }}'),
          templateKey: expr('{{ $("Paramètres 48h").first().json.templateKey }}'),
          channel: 'email',
          campaignKey: expr('{{ $("Paramètres 48h").first().json.campaignKey }}'),
          idempotencyKey: expr('{{ $("Paramètres 48h").first().json.idempotencyEmail }}'),
          confirmLargeAudience: expr('{{ $("Paramètres 48h").first().json.confirmLargeAudience }}'),
        },
        matchingColumns: [],
        schema: dispatchSchema,
        attemptToConvertTypes: false,
      },
      options: { waitForSubWorkflow: true },
    },
    position: [960, -80],
  },
  output: [{ dispatchId: 'd-email', status: 'completed' }],
});

const pushP48h = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Dispatch push 48h',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: DISPATCH,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          segmentKey: expr('{{ $("Paramètres 48h").first().json.segmentKey }}'),
          params: expr('{{ $("Paramètres 48h").first().json.params }}'),
          templateKey: expr('{{ $("Paramètres 48h").first().json.templateKey }}'),
          channel: 'push',
          campaignKey: expr('{{ $("Paramètres 48h").first().json.campaignKey }}'),
          idempotencyKey: expr('{{ $("Paramètres 48h").first().json.idempotencyPush }}'),
          confirmLargeAudience: expr('{{ $("Paramètres 48h").first().json.confirmLargeAudience }}'),
        },
        matchingColumns: [],
        schema: dispatchSchema,
        attemptToConvertTypes: false,
      },
      options: { waitForSubWorkflow: true },
    },
    position: [1200, -80],
  },
  output: [{ dispatchId: 'd-push', status: 'completed' }],
});

const errP48h = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: {
    name: 'Erreur template 48h',
    parameters: {
      errorType: 'errorMessage',
      errorMessage: expr('Template "{{ $("Paramètres 48h").first().json.templateKey }}" absent ou pas marketing/both. Déployer la migration 2150.'),
    },
    position: [960, 140],
  },
});

const trigP3j = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: {
    name: 'Tous les jours 10:30 · palier 3 j',
    parameters: { rule: { interval: [{ field: 'days', daysInterval: 1, triggerAtHour: 10, triggerAtMinute: 30 }] } },
    position: [0, 420],
  },
  output: [{ timestamp: '2026-10-08T10:00:00.000+02:00' }],
});

const setP3j = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Paramètres 3j',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: '3j-seg', name: 'segmentKey', value: 'lapsed_after_session', type: 'string' },
          { id: '3j-params', name: 'params', value: expr('{{ { days: 3, maxDays: 7 } }}'), type: 'object' },
          { id: '3j-tpl', name: 'templateKey', value: 'lapsed_after_session_3d', type: 'string' },
          { id: '3j-ck', name: 'campaignKey', value: expr('lapsed-3j-{{ $now.setZone("Europe/Paris").toFormat("yyyy-MM") }}'), type: 'string' },
          { id: '3j-ie', name: 'idempotencyEmail', value: expr('n8n:lapsed:3j:email:{{ $now.setZone("Europe/Paris").toFormat("yyyy-MM") }}'), type: 'string' },
          { id: '3j-ip', name: 'idempotencyPush', value: expr('n8n:lapsed:3j:push:{{ $now.setZone("Europe/Paris").toFormat("yyyy-MM") }}'), type: 'string' },
          { id: '3j-conf', name: 'confirmLargeAudience', value: false, type: 'boolean' },
        ],
      },
    },
    position: [240, 420],
  },
  output: [{
    segmentKey: 'lapsed_after_session',
    params: { days: 3, maxDays: 7 },
    templateKey: 'lapsed_after_session_3d',
    campaignKey: 'lapsed-3j-2026-10',
    idempotencyEmail: 'n8n:lapsed:3j:email:2026-10',
    idempotencyPush: 'n8n:lapsed:3j:push:2026-10',
    confirmLargeAudience: false,
  }],
});

const catP3j = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Catalogue 3j',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: API,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: { method: 'GET', path: '/internal/outbound/catalog', body: expr('{{ {} }}') },
        matchingColumns: [],
        schema: mapperSchema,
        attemptToConvertTypes: false,
      },
      options: { waitForSubWorkflow: true },
    },
    position: [480, 420],
  },
  output: [{ templates: [{ key: 'lapsed_after_session_3d', category: 'marketing', channel: 'both', variables: [], isActive: true }] }],
});

const ifP3j = ifElse({
  version: 2.3,
  config: {
    name: 'Template 3j prêt ?',
    parameters: {
      conditions: {
        combinator: 'and',
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          {
            leftValue: expr('{{ $json.templates.some(t => t.key === $("Paramètres 3j").first().json.templateKey && t.isActive && t.category === "marketing" && t.channel === "both" && (t.variables || []).length === 0) }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
      },
    },
    position: [720, 420],
  },
});

const emailP3j = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Dispatch email 3j',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: DISPATCH,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          segmentKey: expr('{{ $("Paramètres 3j").first().json.segmentKey }}'),
          params: expr('{{ $("Paramètres 3j").first().json.params }}'),
          templateKey: expr('{{ $("Paramètres 3j").first().json.templateKey }}'),
          channel: 'email',
          campaignKey: expr('{{ $("Paramètres 3j").first().json.campaignKey }}'),
          idempotencyKey: expr('{{ $("Paramètres 3j").first().json.idempotencyEmail }}'),
          confirmLargeAudience: expr('{{ $("Paramètres 3j").first().json.confirmLargeAudience }}'),
        },
        matchingColumns: [],
        schema: dispatchSchema,
        attemptToConvertTypes: false,
      },
      options: { waitForSubWorkflow: true },
    },
    position: [960, 340],
  },
  output: [{ dispatchId: 'd-email', status: 'completed' }],
});

const pushP3j = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Dispatch push 3j',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: DISPATCH,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          segmentKey: expr('{{ $("Paramètres 3j").first().json.segmentKey }}'),
          params: expr('{{ $("Paramètres 3j").first().json.params }}'),
          templateKey: expr('{{ $("Paramètres 3j").first().json.templateKey }}'),
          channel: 'push',
          campaignKey: expr('{{ $("Paramètres 3j").first().json.campaignKey }}'),
          idempotencyKey: expr('{{ $("Paramètres 3j").first().json.idempotencyPush }}'),
          confirmLargeAudience: expr('{{ $("Paramètres 3j").first().json.confirmLargeAudience }}'),
        },
        matchingColumns: [],
        schema: dispatchSchema,
        attemptToConvertTypes: false,
      },
      options: { waitForSubWorkflow: true },
    },
    position: [1200, 340],
  },
  output: [{ dispatchId: 'd-push', status: 'completed' }],
});

const errP3j = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: {
    name: 'Erreur template 3j',
    parameters: {
      errorType: 'errorMessage',
      errorMessage: expr('Template "{{ $("Paramètres 3j").first().json.templateKey }}" absent ou pas marketing/both. Déployer la migration 2150.'),
    },
    position: [960, 560],
  },
});

const trigP7j = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: {
    name: 'Tous les jours 10:40 · palier 7 j',
    parameters: { rule: { interval: [{ field: 'days', daysInterval: 1, triggerAtHour: 10, triggerAtMinute: 40 }] } },
    position: [0, 840],
  },
  output: [{ timestamp: '2026-10-08T10:00:00.000+02:00' }],
});

const setP7j = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Paramètres 7j',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: '7j-seg', name: 'segmentKey', value: 'lapsed_after_session', type: 'string' },
          { id: '7j-params', name: 'params', value: expr('{{ { days: 7, maxDays: 30 } }}'), type: 'object' },
          { id: '7j-tpl', name: 'templateKey', value: 'lapsed_after_session_7d', type: 'string' },
          { id: '7j-ck', name: 'campaignKey', value: expr('lapsed-7j-{{ $now.setZone("Europe/Paris").toFormat("yyyy-MM") }}'), type: 'string' },
          { id: '7j-ie', name: 'idempotencyEmail', value: expr('n8n:lapsed:7j:email:{{ $now.setZone("Europe/Paris").toFormat("yyyy-MM") }}'), type: 'string' },
          { id: '7j-ip', name: 'idempotencyPush', value: expr('n8n:lapsed:7j:push:{{ $now.setZone("Europe/Paris").toFormat("yyyy-MM") }}'), type: 'string' },
          { id: '7j-conf', name: 'confirmLargeAudience', value: false, type: 'boolean' },
        ],
      },
    },
    position: [240, 840],
  },
  output: [{
    segmentKey: 'lapsed_after_session',
    params: { days: 7, maxDays: 30 },
    templateKey: 'lapsed_after_session_7d',
    campaignKey: 'lapsed-7j-2026-10',
    idempotencyEmail: 'n8n:lapsed:7j:email:2026-10',
    idempotencyPush: 'n8n:lapsed:7j:push:2026-10',
    confirmLargeAudience: false,
  }],
});

const catP7j = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Catalogue 7j',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: API,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: { method: 'GET', path: '/internal/outbound/catalog', body: expr('{{ {} }}') },
        matchingColumns: [],
        schema: mapperSchema,
        attemptToConvertTypes: false,
      },
      options: { waitForSubWorkflow: true },
    },
    position: [480, 840],
  },
  output: [{ templates: [{ key: 'lapsed_after_session_7d', category: 'marketing', channel: 'both', variables: [], isActive: true }] }],
});

const ifP7j = ifElse({
  version: 2.3,
  config: {
    name: 'Template 7j prêt ?',
    parameters: {
      conditions: {
        combinator: 'and',
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          {
            leftValue: expr('{{ $json.templates.some(t => t.key === $("Paramètres 7j").first().json.templateKey && t.isActive && t.category === "marketing" && t.channel === "both" && (t.variables || []).length === 0) }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
      },
    },
    position: [720, 840],
  },
});

const emailP7j = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Dispatch email 7j',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: DISPATCH,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          segmentKey: expr('{{ $("Paramètres 7j").first().json.segmentKey }}'),
          params: expr('{{ $("Paramètres 7j").first().json.params }}'),
          templateKey: expr('{{ $("Paramètres 7j").first().json.templateKey }}'),
          channel: 'email',
          campaignKey: expr('{{ $("Paramètres 7j").first().json.campaignKey }}'),
          idempotencyKey: expr('{{ $("Paramètres 7j").first().json.idempotencyEmail }}'),
          confirmLargeAudience: expr('{{ $("Paramètres 7j").first().json.confirmLargeAudience }}'),
        },
        matchingColumns: [],
        schema: dispatchSchema,
        attemptToConvertTypes: false,
      },
      options: { waitForSubWorkflow: true },
    },
    position: [960, 760],
  },
  output: [{ dispatchId: 'd-email', status: 'completed' }],
});

const pushP7j = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Dispatch push 7j',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: DISPATCH,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          segmentKey: expr('{{ $("Paramètres 7j").first().json.segmentKey }}'),
          params: expr('{{ $("Paramètres 7j").first().json.params }}'),
          templateKey: expr('{{ $("Paramètres 7j").first().json.templateKey }}'),
          channel: 'push',
          campaignKey: expr('{{ $("Paramètres 7j").first().json.campaignKey }}'),
          idempotencyKey: expr('{{ $("Paramètres 7j").first().json.idempotencyPush }}'),
          confirmLargeAudience: expr('{{ $("Paramètres 7j").first().json.confirmLargeAudience }}'),
        },
        matchingColumns: [],
        schema: dispatchSchema,
        attemptToConvertTypes: false,
      },
      options: { waitForSubWorkflow: true },
    },
    position: [1200, 760],
  },
  output: [{ dispatchId: 'd-push', status: 'completed' }],
});

const errP7j = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: {
    name: 'Erreur template 7j',
    parameters: {
      errorType: 'errorMessage',
      errorMessage: expr('Template "{{ $("Paramètres 7j").first().json.templateKey }}" absent ou pas marketing/both. Déployer la migration 2150.'),
    },
    position: [960, 980],
  },
});

const trigP30j = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: {
    name: 'Tous les jours 10:50 · palier 30 j',
    parameters: { rule: { interval: [{ field: 'days', daysInterval: 1, triggerAtHour: 10, triggerAtMinute: 50 }] } },
    position: [0, 1260],
  },
  output: [{ timestamp: '2026-10-08T10:00:00.000+02:00' }],
});

const setP30j = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Paramètres 30j',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: '30j-seg', name: 'segmentKey', value: 'lapsed_after_session', type: 'string' },
          { id: '30j-params', name: 'params', value: expr('{{ { days: 30, maxDays: 45 } }}'), type: 'object' },
          { id: '30j-tpl', name: 'templateKey', value: 'lapsed_after_session_30d', type: 'string' },
          { id: '30j-ck', name: 'campaignKey', value: expr('lapsed-30j-{{ $now.setZone("Europe/Paris").toFormat("yyyy-MM") }}'), type: 'string' },
          { id: '30j-ie', name: 'idempotencyEmail', value: expr('n8n:lapsed:30j:email:{{ $now.setZone("Europe/Paris").toFormat("yyyy-MM") }}'), type: 'string' },
          { id: '30j-ip', name: 'idempotencyPush', value: expr('n8n:lapsed:30j:push:{{ $now.setZone("Europe/Paris").toFormat("yyyy-MM") }}'), type: 'string' },
          { id: '30j-conf', name: 'confirmLargeAudience', value: false, type: 'boolean' },
        ],
      },
    },
    position: [240, 1260],
  },
  output: [{
    segmentKey: 'lapsed_after_session',
    params: { days: 30, maxDays: 45 },
    templateKey: 'lapsed_after_session_30d',
    campaignKey: 'lapsed-30j-2026-10',
    idempotencyEmail: 'n8n:lapsed:30j:email:2026-10',
    idempotencyPush: 'n8n:lapsed:30j:push:2026-10',
    confirmLargeAudience: false,
  }],
});

const catP30j = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Catalogue 30j',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: API,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: { method: 'GET', path: '/internal/outbound/catalog', body: expr('{{ {} }}') },
        matchingColumns: [],
        schema: mapperSchema,
        attemptToConvertTypes: false,
      },
      options: { waitForSubWorkflow: true },
    },
    position: [480, 1260],
  },
  output: [{ templates: [{ key: 'lapsed_after_session_30d', category: 'marketing', channel: 'both', variables: [], isActive: true }] }],
});

const ifP30j = ifElse({
  version: 2.3,
  config: {
    name: 'Template 30j prêt ?',
    parameters: {
      conditions: {
        combinator: 'and',
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          {
            leftValue: expr('{{ $json.templates.some(t => t.key === $("Paramètres 30j").first().json.templateKey && t.isActive && t.category === "marketing" && t.channel === "both" && (t.variables || []).length === 0) }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
      },
    },
    position: [720, 1260],
  },
});

const emailP30j = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Dispatch email 30j',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: DISPATCH,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          segmentKey: expr('{{ $("Paramètres 30j").first().json.segmentKey }}'),
          params: expr('{{ $("Paramètres 30j").first().json.params }}'),
          templateKey: expr('{{ $("Paramètres 30j").first().json.templateKey }}'),
          channel: 'email',
          campaignKey: expr('{{ $("Paramètres 30j").first().json.campaignKey }}'),
          idempotencyKey: expr('{{ $("Paramètres 30j").first().json.idempotencyEmail }}'),
          confirmLargeAudience: expr('{{ $("Paramètres 30j").first().json.confirmLargeAudience }}'),
        },
        matchingColumns: [],
        schema: dispatchSchema,
        attemptToConvertTypes: false,
      },
      options: { waitForSubWorkflow: true },
    },
    position: [960, 1180],
  },
  output: [{ dispatchId: 'd-email', status: 'completed' }],
});

const pushP30j = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Dispatch push 30j',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: DISPATCH,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          segmentKey: expr('{{ $("Paramètres 30j").first().json.segmentKey }}'),
          params: expr('{{ $("Paramètres 30j").first().json.params }}'),
          templateKey: expr('{{ $("Paramètres 30j").first().json.templateKey }}'),
          channel: 'push',
          campaignKey: expr('{{ $("Paramètres 30j").first().json.campaignKey }}'),
          idempotencyKey: expr('{{ $("Paramètres 30j").first().json.idempotencyPush }}'),
          confirmLargeAudience: expr('{{ $("Paramètres 30j").first().json.confirmLargeAudience }}'),
        },
        matchingColumns: [],
        schema: dispatchSchema,
        attemptToConvertTypes: false,
      },
      options: { waitForSubWorkflow: true },
    },
    position: [1200, 1180],
  },
  output: [{ dispatchId: 'd-push', status: 'completed' }],
});

const errP30j = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: {
    name: 'Erreur template 30j',
    parameters: {
      errorType: 'errorMessage',
      errorMessage: expr('Template "{{ $("Paramètres 30j").first().json.templateKey }}" absent ou pas marketing/both. Déployer la migration 2150.'),
    },
    position: [960, 1400],
  },
});

const note = sticky(
  '## Lapsed après une séance réelle\n' +
    'Segment `lapsed_after_session` (hors exo onboarding) + fenêtre min/max. Push + email.\n\n' +
    '48 h (toutes les heures, 48 h-3 j) · 3 j / 7 j / 30 j (quotidien).\n\n' +
    'Idempotence mensuelle : `n8n:lapsed:<palier>:email|push:yyyy-MM`.\n' +
    'Non publié tant que tu ne le demandes pas.',
  [setP48h],
  { color: 6 },
);

export default workflow(
  'one-more-outbound-campaign-lapsed-after-session',
  'One More · Outbound · Campagne · Lapsed après séance (push + email)',
)
  .add(trigP48h)
  .to(setP48h)
  .to(catP48h)
  .to(ifP48h.onTrue(emailP48h).onFalse(errP48h))
  .add(emailP48h)
  .to(pushP48h)
  
  .add(trigP3j)
  .to(setP3j)
  .to(catP3j)
  .to(ifP3j.onTrue(emailP3j).onFalse(errP3j))
  .add(emailP3j)
  .to(pushP3j)
  
  .add(trigP7j)
  .to(setP7j)
  .to(catP7j)
  .to(ifP7j.onTrue(emailP7j).onFalse(errP7j))
  .add(emailP7j)
  .to(pushP7j)
  
  .add(trigP30j)
  .to(setP30j)
  .to(catP30j)
  .to(ifP30j.onTrue(emailP30j).onFalse(errP30j))
  .add(emailP30j)
  .to(pushP30j)
  .add(note)
  .group('Palier 48 h — paramètres', [setP48h, catP48h], { description: 'Fenêtre 48 h–3 j, template lapsed_after_session_48h.' })
  .group('Palier 48 h — dispatch', [emailP48h, pushP48h], { description: 'Email puis push, idempotence mensuelle.' })
  .group('Palier 3 j — paramètres', [setP3j, catP3j], { description: 'Fenêtre 3–7 j, template lapsed_after_session_3d.' })
  .group('Palier 3 j — dispatch', [emailP3j, pushP3j], { description: 'Email puis push, idempotence mensuelle.' })
  .group('Palier 7 j — paramètres', [setP7j, catP7j], { description: 'Fenêtre 7–30 j, template lapsed_after_session_7d.' })
  .group('Palier 7 j — dispatch', [emailP7j, pushP7j], { description: 'Email puis push, idempotence mensuelle.' })
  .group('Palier 30 j — paramètres', [setP30j, catP30j], { description: 'Fenêtre 30–45 j, template lapsed_after_session_30d.' })
  .group('Palier 30 j — dispatch', [emailP30j, pushP30j], { description: 'Email puis push, idempotence mensuelle.' });
