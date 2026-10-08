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

const trigP1h = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: {
    name: 'Toutes les 15 min · palier 1 h',
    parameters: { rule: { interval: [{ field: 'minutes', minutesInterval: 15 }] } },
    position: [0, 0],
  },
  output: [{ timestamp: '2026-10-08T10:00:00.000+02:00' }],
});

const setP1h = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Paramètres 1h',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: '1h-seg', name: 'segmentKey', value: 'registered_no_exercise', type: 'string' },
          { id: '1h-params', name: 'params', value: expr('{{ { hours: 1, maxHours: 24 } }}'), type: 'object' },
          { id: '1h-tpl', name: 'templateKey', value: 'registered_no_exercise_1h', type: 'string' },
          { id: '1h-ck', name: 'campaignKey', value: 'no-exo-1h', type: 'string' },
          { id: '1h-ie', name: 'idempotencyEmail', value: 'n8n:no-exo:1h:email', type: 'string' },
          { id: '1h-ip', name: 'idempotencyPush', value: 'n8n:no-exo:1h:push', type: 'string' },
          { id: '1h-conf', name: 'confirmLargeAudience', value: false, type: 'boolean' },
        ],
      },
    },
    position: [240, 0],
  },
  output: [{
    segmentKey: 'registered_no_exercise',
    params: { hours: 1, maxHours: 24 },
    templateKey: 'registered_no_exercise_1h',
    campaignKey: 'no-exo-1h',
    idempotencyEmail: 'n8n:no-exo:1h:email',
    idempotencyPush: 'n8n:no-exo:1h:push',
    confirmLargeAudience: false,
  }],
});

const catP1h = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Catalogue 1h',
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
  output: [{ templates: [{ key: 'registered_no_exercise_1h', category: 'marketing', channel: 'both', variables: [], isActive: true }] }],
});

const ifP1h = ifElse({
  version: 2.3,
  config: {
    name: 'Template 1h prêt ?',
    parameters: {
      conditions: {
        combinator: 'and',
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          {
            leftValue: expr('{{ $json.templates.some(t => t.key === $("Paramètres 1h").first().json.templateKey && t.isActive && t.category === "marketing" && t.channel === "both" && (t.variables || []).length === 0) }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
      },
    },
    position: [720, 0],
  },
});

const emailP1h = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Dispatch email 1h',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: DISPATCH,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          segmentKey: expr('{{ $("Paramètres 1h").first().json.segmentKey }}'),
          params: expr('{{ $("Paramètres 1h").first().json.params }}'),
          templateKey: expr('{{ $("Paramètres 1h").first().json.templateKey }}'),
          channel: 'email',
          campaignKey: expr('{{ $("Paramètres 1h").first().json.campaignKey }}'),
          idempotencyKey: expr('{{ $("Paramètres 1h").first().json.idempotencyEmail }}'),
          confirmLargeAudience: expr('{{ $("Paramètres 1h").first().json.confirmLargeAudience }}'),
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

const pushP1h = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Dispatch push 1h',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: DISPATCH,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          segmentKey: expr('{{ $("Paramètres 1h").first().json.segmentKey }}'),
          params: expr('{{ $("Paramètres 1h").first().json.params }}'),
          templateKey: expr('{{ $("Paramètres 1h").first().json.templateKey }}'),
          channel: 'push',
          campaignKey: expr('{{ $("Paramètres 1h").first().json.campaignKey }}'),
          idempotencyKey: expr('{{ $("Paramètres 1h").first().json.idempotencyPush }}'),
          confirmLargeAudience: expr('{{ $("Paramètres 1h").first().json.confirmLargeAudience }}'),
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

const errP1h = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: {
    name: 'Erreur template 1h',
    parameters: {
      errorType: 'errorMessage',
      errorMessage: expr('Template "{{ $("Paramètres 1h").first().json.templateKey }}" absent ou pas marketing/both. Déployer la migration 2150.'),
    },
    position: [960, 140],
  },
});

const trigP24h = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: {
    name: 'Toutes les heures · palier 24 h',
    parameters: { rule: { interval: [{ field: 'hours', hoursInterval: 1, triggerAtMinute: 10 }] } },
    position: [0, 420],
  },
  output: [{ timestamp: '2026-10-08T10:00:00.000+02:00' }],
});

const setP24h = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Paramètres 24h',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: '24h-seg', name: 'segmentKey', value: 'registered_no_exercise', type: 'string' },
          { id: '24h-params', name: 'params', value: expr('{{ { hours: 24, maxDays: 3 } }}'), type: 'object' },
          { id: '24h-tpl', name: 'templateKey', value: 'registered_no_exercise_24h', type: 'string' },
          { id: '24h-ck', name: 'campaignKey', value: 'no-exo-24h', type: 'string' },
          { id: '24h-ie', name: 'idempotencyEmail', value: 'n8n:no-exo:24h:email', type: 'string' },
          { id: '24h-ip', name: 'idempotencyPush', value: 'n8n:no-exo:24h:push', type: 'string' },
          { id: '24h-conf', name: 'confirmLargeAudience', value: false, type: 'boolean' },
        ],
      },
    },
    position: [240, 420],
  },
  output: [{
    segmentKey: 'registered_no_exercise',
    params: { hours: 24, maxDays: 3 },
    templateKey: 'registered_no_exercise_24h',
    campaignKey: 'no-exo-24h',
    idempotencyEmail: 'n8n:no-exo:24h:email',
    idempotencyPush: 'n8n:no-exo:24h:push',
    confirmLargeAudience: false,
  }],
});

const catP24h = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Catalogue 24h',
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
  output: [{ templates: [{ key: 'registered_no_exercise_24h', category: 'marketing', channel: 'both', variables: [], isActive: true }] }],
});

const ifP24h = ifElse({
  version: 2.3,
  config: {
    name: 'Template 24h prêt ?',
    parameters: {
      conditions: {
        combinator: 'and',
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          {
            leftValue: expr('{{ $json.templates.some(t => t.key === $("Paramètres 24h").first().json.templateKey && t.isActive && t.category === "marketing" && t.channel === "both" && (t.variables || []).length === 0) }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
      },
    },
    position: [720, 420],
  },
});

const emailP24h = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Dispatch email 24h',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: DISPATCH,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          segmentKey: expr('{{ $("Paramètres 24h").first().json.segmentKey }}'),
          params: expr('{{ $("Paramètres 24h").first().json.params }}'),
          templateKey: expr('{{ $("Paramètres 24h").first().json.templateKey }}'),
          channel: 'email',
          campaignKey: expr('{{ $("Paramètres 24h").first().json.campaignKey }}'),
          idempotencyKey: expr('{{ $("Paramètres 24h").first().json.idempotencyEmail }}'),
          confirmLargeAudience: expr('{{ $("Paramètres 24h").first().json.confirmLargeAudience }}'),
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

const pushP24h = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Dispatch push 24h',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: DISPATCH,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          segmentKey: expr('{{ $("Paramètres 24h").first().json.segmentKey }}'),
          params: expr('{{ $("Paramètres 24h").first().json.params }}'),
          templateKey: expr('{{ $("Paramètres 24h").first().json.templateKey }}'),
          channel: 'push',
          campaignKey: expr('{{ $("Paramètres 24h").first().json.campaignKey }}'),
          idempotencyKey: expr('{{ $("Paramètres 24h").first().json.idempotencyPush }}'),
          confirmLargeAudience: expr('{{ $("Paramètres 24h").first().json.confirmLargeAudience }}'),
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

const errP24h = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: {
    name: 'Erreur template 24h',
    parameters: {
      errorType: 'errorMessage',
      errorMessage: expr('Template "{{ $("Paramètres 24h").first().json.templateKey }}" absent ou pas marketing/both. Déployer la migration 2150.'),
    },
    position: [960, 560],
  },
});

const trigP3j = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: {
    name: 'Tous les jours 10:00 · palier 3 j',
    parameters: { rule: { interval: [{ field: 'days', daysInterval: 1, triggerAtHour: 10, triggerAtMinute: 0 }] } },
    position: [0, 840],
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
          { id: '3j-seg', name: 'segmentKey', value: 'registered_no_exercise', type: 'string' },
          { id: '3j-params', name: 'params', value: expr('{{ { days: 3, maxDays: 7 } }}'), type: 'object' },
          { id: '3j-tpl', name: 'templateKey', value: 'registered_no_exercise_3d', type: 'string' },
          { id: '3j-ck', name: 'campaignKey', value: 'no-exo-3j', type: 'string' },
          { id: '3j-ie', name: 'idempotencyEmail', value: 'n8n:no-exo:3j:email', type: 'string' },
          { id: '3j-ip', name: 'idempotencyPush', value: 'n8n:no-exo:3j:push', type: 'string' },
          { id: '3j-conf', name: 'confirmLargeAudience', value: false, type: 'boolean' },
        ],
      },
    },
    position: [240, 840],
  },
  output: [{
    segmentKey: 'registered_no_exercise',
    params: { days: 3, maxDays: 7 },
    templateKey: 'registered_no_exercise_3d',
    campaignKey: 'no-exo-3j',
    idempotencyEmail: 'n8n:no-exo:3j:email',
    idempotencyPush: 'n8n:no-exo:3j:push',
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
    position: [480, 840],
  },
  output: [{ templates: [{ key: 'registered_no_exercise_3d', category: 'marketing', channel: 'both', variables: [], isActive: true }] }],
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
    position: [720, 840],
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
    position: [960, 760],
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
    position: [1200, 760],
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
    position: [960, 980],
  },
});

const trigP7j = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: {
    name: 'Tous les jours 10:10 · palier 7 j',
    parameters: { rule: { interval: [{ field: 'days', daysInterval: 1, triggerAtHour: 10, triggerAtMinute: 10 }] } },
    position: [0, 1260],
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
          { id: '7j-seg', name: 'segmentKey', value: 'registered_no_exercise', type: 'string' },
          { id: '7j-params', name: 'params', value: expr('{{ { days: 7, maxDays: 30 } }}'), type: 'object' },
          { id: '7j-tpl', name: 'templateKey', value: 'registered_no_exercise_7d', type: 'string' },
          { id: '7j-ck', name: 'campaignKey', value: 'no-exo-7j', type: 'string' },
          { id: '7j-ie', name: 'idempotencyEmail', value: 'n8n:no-exo:7j:email', type: 'string' },
          { id: '7j-ip', name: 'idempotencyPush', value: 'n8n:no-exo:7j:push', type: 'string' },
          { id: '7j-conf', name: 'confirmLargeAudience', value: false, type: 'boolean' },
        ],
      },
    },
    position: [240, 1260],
  },
  output: [{
    segmentKey: 'registered_no_exercise',
    params: { days: 7, maxDays: 30 },
    templateKey: 'registered_no_exercise_7d',
    campaignKey: 'no-exo-7j',
    idempotencyEmail: 'n8n:no-exo:7j:email',
    idempotencyPush: 'n8n:no-exo:7j:push',
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
    position: [480, 1260],
  },
  output: [{ templates: [{ key: 'registered_no_exercise_7d', category: 'marketing', channel: 'both', variables: [], isActive: true }] }],
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
    position: [720, 1260],
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
    position: [960, 1180],
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
    position: [1200, 1180],
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
    position: [960, 1400],
  },
});

const trigP30j = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: {
    name: 'Tous les jours 10:20 · palier 30 j',
    parameters: { rule: { interval: [{ field: 'days', daysInterval: 1, triggerAtHour: 10, triggerAtMinute: 20 }] } },
    position: [0, 1680],
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
          { id: '30j-seg', name: 'segmentKey', value: 'registered_no_exercise', type: 'string' },
          { id: '30j-params', name: 'params', value: expr('{{ { days: 30, maxDays: 45 } }}'), type: 'object' },
          { id: '30j-tpl', name: 'templateKey', value: 'registered_no_exercise_30d', type: 'string' },
          { id: '30j-ck', name: 'campaignKey', value: 'no-exo-30j', type: 'string' },
          { id: '30j-ie', name: 'idempotencyEmail', value: 'n8n:no-exo:30j:email', type: 'string' },
          { id: '30j-ip', name: 'idempotencyPush', value: 'n8n:no-exo:30j:push', type: 'string' },
          { id: '30j-conf', name: 'confirmLargeAudience', value: false, type: 'boolean' },
        ],
      },
    },
    position: [240, 1680],
  },
  output: [{
    segmentKey: 'registered_no_exercise',
    params: { days: 30, maxDays: 45 },
    templateKey: 'registered_no_exercise_30d',
    campaignKey: 'no-exo-30j',
    idempotencyEmail: 'n8n:no-exo:30j:email',
    idempotencyPush: 'n8n:no-exo:30j:push',
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
    position: [480, 1680],
  },
  output: [{ templates: [{ key: 'registered_no_exercise_30d', category: 'marketing', channel: 'both', variables: [], isActive: true }] }],
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
    position: [720, 1680],
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
    position: [960, 1600],
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
    position: [1200, 1600],
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
    position: [960, 1820],
  },
});

const note = sticky(
  '## Pas d\'exo réel (hors onboarding)\n' +
    'Segment `registered_no_exercise` avec fenêtre min/max. Push + email à chaque palier.\n\n' +
    '1h (toutes les 15 min, 1-24 h) · 24 h (toutes les heures, 24 h-3 j) · 3 j / 7 j / 30 j (quotidien).\n\n' +
    'Idempotence à vie : `n8n:no-exo:<palier>:email|push`. Template `channel: both`, `category: marketing`.\n' +
    'Non publié tant que tu ne le demandes pas.',
  [setP1h],
  { color: 6 },
);

export default workflow(
  'one-more-outbound-campaign-registered-no-exercise',
  'One More · Outbound · Campagne · Pas d\'exo réel (push + email)',
)
  .add(trigP1h)
  .to(setP1h)
  .to(catP1h)
  .to(ifP1h.onTrue(emailP1h).onFalse(errP1h))
  .add(emailP1h)
  .to(pushP1h)
  
  .add(trigP24h)
  .to(setP24h)
  .to(catP24h)
  .to(ifP24h.onTrue(emailP24h).onFalse(errP24h))
  .add(emailP24h)
  .to(pushP24h)
  
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
  .group('Palier 1 h — paramètres', [setP1h, catP1h], { description: 'Fenêtre 1–24 h, template registered_no_exercise_1h.' })
  .group('Palier 1 h — dispatch', [emailP1h, pushP1h], { description: 'Email puis push, idempotence à vie.' })
  .group('Palier 24 h — paramètres', [setP24h, catP24h], { description: 'Fenêtre 24 h–3 j, template registered_no_exercise_24h.' })
  .group('Palier 24 h — dispatch', [emailP24h, pushP24h], { description: 'Email puis push, idempotence à vie.' })
  .group('Palier 3 j — paramètres', [setP3j, catP3j], { description: 'Fenêtre 3–7 j, template registered_no_exercise_3d.' })
  .group('Palier 3 j — dispatch', [emailP3j, pushP3j], { description: 'Email puis push, idempotence à vie.' })
  .group('Palier 7 j — paramètres', [setP7j, catP7j], { description: 'Fenêtre 7–30 j, template registered_no_exercise_7d.' })
  .group('Palier 7 j — dispatch', [emailP7j, pushP7j], { description: 'Email puis push, idempotence à vie.' })
  .group('Palier 30 j — paramètres', [setP30j, catP30j], { description: 'Fenêtre 30–45 j, template registered_no_exercise_30d.' })
  .group('Palier 30 j — dispatch', [emailP30j, pushP30j], { description: 'Email puis push, idempotence à vie.' });
