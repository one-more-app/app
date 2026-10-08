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

const trigP2h = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: {
    name: 'Toutes les 15 min · palier 2 h',
    parameters: { rule: { interval: [{ field: 'minutes', minutesInterval: 15 }] } },
    position: [0, 0],
  },
  output: [{ timestamp: '2026-10-08T10:00:00.000+02:00' }],
});

const setP2h = node({
  type: 'n8n-nodes-base.set',
  version: 3.5,
  config: {
    name: 'Paramètres 2h',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: '2h-seg', name: 'segmentKey', value: 'registered_no_exercise', type: 'string' },
          { id: '2h-params', name: 'params', value: expr('{{ { hours: 2, maxHours: 24, activationHook: "training_reminder" } }}'), type: 'object' },
          { id: '2h-tpl', name: 'templateKey', value: 'registered_no_exercise_reminder_2h', type: 'string' },
          { id: '2h-ck', name: 'campaignKey', value: 'no-exo-reminder-2h', type: 'string' },
          { id: '2h-ie', name: 'idempotencyEmail', value: 'n8n:no-exo-reminder:2h:email', type: 'string' },
          { id: '2h-ip', name: 'idempotencyPush', value: 'n8n:no-exo-reminder:2h:push', type: 'string' },
          { id: '2h-conf', name: 'confirmLargeAudience', value: false, type: 'boolean' },
        ],
      },
    },
    position: [240, 0],
  },
  output: [{
    segmentKey: 'registered_no_exercise',
    params: { hours: 2, maxHours: 24, activationHook: 'training_reminder' },
    templateKey: 'registered_no_exercise_reminder_2h',
    campaignKey: 'no-exo-reminder-2h',
    idempotencyEmail: 'n8n:no-exo-reminder:2h:email',
    idempotencyPush: 'n8n:no-exo-reminder:2h:push',
    confirmLargeAudience: false,
  }],
});

const catP2h = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Catalogue 2h',
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
  output: [{ templates: [{ key: 'registered_no_exercise_reminder_2h', category: 'marketing', channel: 'both', variables: [], isActive: true }] }],
});

const ifP2h = ifElse({
  version: 2.3,
  config: {
    name: 'Template 2h prêt ?',
    parameters: {
      conditions: {
        combinator: 'and',
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [
          {
            leftValue: expr('{{ $json.templates.some(t => t.key === $("Paramètres 2h").first().json.templateKey && t.isActive && t.category === "marketing" && t.channel === "both" && (t.variables || []).length === 0) }}'),
            rightValue: true,
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
      },
    },
    position: [720, 0],
  },
});

const emailP2h = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Dispatch email 2h',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: DISPATCH,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          segmentKey: expr('{{ $("Paramètres 2h").first().json.segmentKey }}'),
          params: expr('{{ $("Paramètres 2h").first().json.params }}'),
          templateKey: expr('{{ $("Paramètres 2h").first().json.templateKey }}'),
          channel: 'email',
          campaignKey: expr('{{ $("Paramètres 2h").first().json.campaignKey }}'),
          idempotencyKey: expr('{{ $("Paramètres 2h").first().json.idempotencyEmail }}'),
          confirmLargeAudience: expr('{{ $("Paramètres 2h").first().json.confirmLargeAudience }}'),
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

const pushP2h = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.4,
  config: {
    name: 'Dispatch push 2h',
    parameters: {
      mode: 'once',
      source: 'database',
      workflowId: DISPATCH,
      workflowInputs: {
        mappingMode: 'defineBelow',
        value: {
          segmentKey: expr('{{ $("Paramètres 2h").first().json.segmentKey }}'),
          params: expr('{{ $("Paramètres 2h").first().json.params }}'),
          templateKey: expr('{{ $("Paramètres 2h").first().json.templateKey }}'),
          channel: 'push',
          campaignKey: expr('{{ $("Paramètres 2h").first().json.campaignKey }}'),
          idempotencyKey: expr('{{ $("Paramètres 2h").first().json.idempotencyPush }}'),
          confirmLargeAudience: expr('{{ $("Paramètres 2h").first().json.confirmLargeAudience }}'),
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

const errP2h = node({
  type: 'n8n-nodes-base.stopAndError',
  version: 1,
  config: {
    name: 'Erreur template 2h',
    parameters: {
      errorType: 'errorMessage',
      errorMessage: expr('Template "{{ $("Paramètres 2h").first().json.templateKey }}" absent ou pas marketing/both. Déployer la migration 2161.'),
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
          { id: '24h-params', name: 'params', value: expr('{{ { hours: 24, maxDays: 7, activationHook: "training_reminder" } }}'), type: 'object' },
          { id: '24h-tpl', name: 'templateKey', value: 'registered_no_exercise_reminder_24h', type: 'string' },
          { id: '24h-ck', name: 'campaignKey', value: 'no-exo-reminder-24h', type: 'string' },
          { id: '24h-ie', name: 'idempotencyEmail', value: 'n8n:no-exo-reminder:24h:email', type: 'string' },
          { id: '24h-ip', name: 'idempotencyPush', value: 'n8n:no-exo-reminder:24h:push', type: 'string' },
          { id: '24h-conf', name: 'confirmLargeAudience', value: false, type: 'boolean' },
        ],
      },
    },
    position: [240, 420],
  },
  output: [{
    segmentKey: 'registered_no_exercise',
    params: { hours: 24, maxDays: 7, activationHook: 'training_reminder' },
    templateKey: 'registered_no_exercise_reminder_24h',
    campaignKey: 'no-exo-reminder-24h',
    idempotencyEmail: 'n8n:no-exo-reminder:24h:email',
    idempotencyPush: 'n8n:no-exo-reminder:24h:push',
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
  output: [{ templates: [{ key: 'registered_no_exercise_reminder_24h', category: 'marketing', channel: 'both', variables: [], isActive: true }] }],
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
      errorMessage: expr('Template "{{ $("Paramètres 24h").first().json.templateKey }}" absent ou pas marketing/both. Déployer la migration 2161.'),
    },
    position: [960, 560],
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
          { id: '7j-params', name: 'params', value: expr('{{ { days: 7, maxDays: 30, activationHook: "training_reminder" } }}'), type: 'object' },
          { id: '7j-tpl', name: 'templateKey', value: 'registered_no_exercise_reminder_7d', type: 'string' },
          { id: '7j-ck', name: 'campaignKey', value: 'no-exo-reminder-7j', type: 'string' },
          { id: '7j-ie', name: 'idempotencyEmail', value: 'n8n:no-exo-reminder:7j:email', type: 'string' },
          { id: '7j-ip', name: 'idempotencyPush', value: 'n8n:no-exo-reminder:7j:push', type: 'string' },
          { id: '7j-conf', name: 'confirmLargeAudience', value: false, type: 'boolean' },
        ],
      },
    },
    position: [240, 1260],
  },
  output: [{
    segmentKey: 'registered_no_exercise',
    params: { days: 7, maxDays: 30, activationHook: 'training_reminder' },
    templateKey: 'registered_no_exercise_reminder_7d',
    campaignKey: 'no-exo-reminder-7j',
    idempotencyEmail: 'n8n:no-exo-reminder:7j:email',
    idempotencyPush: 'n8n:no-exo-reminder:7j:push',
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
  output: [{ templates: [{ key: 'registered_no_exercise_reminder_7d', category: 'marketing', channel: 'both', variables: [], isActive: true }] }],
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
      errorMessage: expr('Template "{{ $("Paramètres 7j").first().json.templateKey }}" absent ou pas marketing/both. Déployer la migration 2161.'),
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
          { id: '30j-params', name: 'params', value: expr('{{ { days: 30, maxDays: 45, activationHook: "training_reminder" } }}'), type: 'object' },
          { id: '30j-tpl', name: 'templateKey', value: 'registered_no_exercise_reminder_30d', type: 'string' },
          { id: '30j-ck', name: 'campaignKey', value: 'no-exo-reminder-30j', type: 'string' },
          { id: '30j-ie', name: 'idempotencyEmail', value: 'n8n:no-exo-reminder:30j:email', type: 'string' },
          { id: '30j-ip', name: 'idempotencyPush', value: 'n8n:no-exo-reminder:30j:push', type: 'string' },
          { id: '30j-conf', name: 'confirmLargeAudience', value: false, type: 'boolean' },
        ],
      },
    },
    position: [240, 1680],
  },
  output: [{
    segmentKey: 'registered_no_exercise',
    params: { days: 30, maxDays: 45, activationHook: 'training_reminder' },
    templateKey: 'registered_no_exercise_reminder_30d',
    campaignKey: 'no-exo-reminder-30j',
    idempotencyEmail: 'n8n:no-exo-reminder:30j:email',
    idempotencyPush: 'n8n:no-exo-reminder:30j:push',
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
  output: [{ templates: [{ key: 'registered_no_exercise_reminder_30d', category: 'marketing', channel: 'both', variables: [], isActive: true }] }],
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
      errorMessage: expr('Template "{{ $("Paramètres 30j").first().json.templateKey }}" absent ou pas marketing/both. Déployer la migration 2161.'),
    },
    position: [960, 1820],
  },
});

const note = sticky(
  '## Pas d\'exo + rappel séance configuré\n' +
    'Segment `registered_no_exercise` + `activationHook: training_reminder`. Push + email à chaque palier.\n\n' +
    '2 h (15 min, 2–24 h) · 24 h (horaire, 24 h–7 j) · 7 j / 30 j (quotidien).\n\n' +
    'Idempotence à vie : `n8n:no-exo-reminder:<palier>:email|push`. Migration templates 2161.\n' +
    'Non publié tant que tu ne le demandes pas.',
  [setP2h],
  { color: 6 },
);

export default workflow(
  'one-more-outbound-campaign-registered-no-exercise-reminder',
  'One More · Outbound · Campagne · Pas d\'exo · rappel activé (push + email)',
)
  .add(trigP2h)
  .to(setP2h)
  .to(catP2h)
  .to(ifP2h.onTrue(emailP2h).onFalse(errP2h))
  .add(emailP2h)
  .to(pushP2h)
  
  .add(trigP24h)
  .to(setP24h)
  .to(catP24h)
  .to(ifP24h.onTrue(emailP24h).onFalse(errP24h))
  .add(emailP24h)
  .to(pushP24h)
  
  
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
  .group('Palier 2 h — paramètres', [setP2h, catP2h], { description: 'Fenêtre 2–24 h, template registered_no_exercise_reminder_2h.' })
  .group('Palier 2 h — dispatch', [emailP2h, pushP2h], { description: 'Email puis push, idempotence à vie.' })
  .group('Palier 24 h — paramètres', [setP24h, catP24h], { description: 'Fenêtre 24 h–7 j, template registered_no_exercise_reminder_24h.' })
  .group('Palier 24 h — dispatch', [emailP24h, pushP24h], { description: 'Email puis push, idempotence à vie.' })
  .group('Palier 7 j — paramètres', [setP7j, catP7j], { description: 'Fenêtre 7–30 j, template registered_no_exercise_reminder_7d.' })
  .group('Palier 7 j — dispatch', [emailP7j, pushP7j], { description: 'Email puis push, idempotence à vie.' })
  .group('Palier 30 j — paramètres', [setP30j, catP30j], { description: 'Fenêtre 30–45 j, template registered_no_exercise_reminder_30d.' })
  .group('Palier 30 j — dispatch', [emailP30j, pushP30j], { description: 'Email puis push, idempotence à vie.' });
